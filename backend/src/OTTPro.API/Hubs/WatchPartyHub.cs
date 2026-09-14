using Microsoft.AspNetCore.SignalR;

namespace OTTPro.API.Hubs;

public class WatchPartyHub : Hub
{
    private static readonly Dictionary<string, HashSet<string>> RoomMembers = new();
    private static readonly Dictionary<string, RoomPlaybackInfo> RoomStates = new();
    private static readonly object LockObj = new();

    public class RoomPlaybackInfo
    {
        public string Action { get; set; } = "PAUSE";
        public double CurrentTime { get; set; } = 0;
        public string VideoUrl { get; set; } = string.Empty;
        public string VideoTitle { get; set; } = string.Empty;
        public string HostId { get; set; } = string.Empty;
        public string HostUsername { get; set; } = string.Empty;
        public bool IsScreenSharing { get; set; } = false;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    public async Task JoinParty(string roomCode, string username)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);

        lock (LockObj)
        {
            if (!RoomMembers.ContainsKey(roomCode))
            {
                RoomMembers[roomCode] = new HashSet<string>();
            }
            RoomMembers[roomCode].Add(username);

            if (!RoomStates.ContainsKey(roomCode))
            {
                RoomStates[roomCode] = new RoomPlaybackInfo
                {
                    HostId = Context.ConnectionId,
                    HostUsername = username
                };
            }
        }

        // Notify room of member join
        await Clients.Group(roomCode).SendAsync("MemberJoined", new
        {
            Username = username,
            Members = RoomMembers[roomCode].ToList(),
            Timestamp = DateTime.UtcNow
        });

        // Send current room playback state to the newly joined member
        if (RoomStates.TryGetValue(roomCode, out var state))
        {
            await Clients.Caller.SendAsync("CurrentRoomState", state);
        }
    }

    public async Task LeaveParty(string roomCode, string username)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);

        lock (LockObj)
        {
            if (RoomMembers.TryGetValue(roomCode, out var members))
            {
                members.Remove(username);
            }
        }

        await Clients.Group(roomCode).SendAsync("MemberLeft", new
        {
            Username = username,
            Members = RoomMembers.ContainsKey(roomCode) ? RoomMembers[roomCode].ToList() : new List<string>(),
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task SendPlaybackAction(string roomCode, string action, double currentTime, string? videoUrl, string? videoTitle)
    {
        lock (LockObj)
        {
            if (!RoomStates.ContainsKey(roomCode))
            {
                RoomStates[roomCode] = new RoomPlaybackInfo();
            }

            var state = RoomStates[roomCode];
            state.Action = action;
            state.CurrentTime = currentTime;
            if (!string.IsNullOrEmpty(videoUrl))
            {
                state.VideoUrl = videoUrl;
            }
            if (!string.IsNullOrEmpty(videoTitle))
            {
                state.VideoTitle = videoTitle;
            }
            state.LastUpdated = DateTime.UtcNow;
        }

        await Clients.Group(roomCode).SendAsync("PlaybackSynced", new
        {
            Action = action,
            CurrentTime = currentTime,
            VideoUrl = videoUrl,
            VideoTitle = videoTitle,
            ServerTimestamp = DateTime.UtcNow
        });
    }

    public async Task SendRoomMessage(string roomCode, string sender, string message)
    {
        await Clients.Group(roomCode).SendAsync("ReceiveRoomMessage", new
        {
            Id = Guid.NewGuid().ToString("N"),
            Sender = sender,
            Message = message,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task SendRoomReaction(string roomCode, string sender, string emoji)
    {
        await Clients.Group(roomCode).SendAsync("ReceiveRoomReaction", new
        {
            Sender = sender,
            Emoji = emoji,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task SendScreenShareToggle(string roomCode, bool isSharing, string hostUsername)
    {
        lock (LockObj)
        {
            if (RoomStates.ContainsKey(roomCode))
            {
                RoomStates[roomCode].IsScreenSharing = isSharing;
            }
        }

        await Clients.Group(roomCode).SendAsync("ScreenShareToggled", new
        {
            IsSharing = isSharing,
            HostUsername = hostUsername
        });
    }

    public async Task SendSignalData(string roomCode, object signalData)
    {
        await Clients.OthersInGroup(roomCode).SendAsync("ReceiveSignalData", signalData);
    }

    public async Task CloseParty(string roomCode, string username)
    {
        lock (LockObj)
        {
            RoomMembers.Remove(roomCode);
            RoomStates.Remove(roomCode);
        }

        await Clients.Group(roomCode).SendAsync("PartyClosed", new
        {
            RoomCode = roomCode,
            ClosedBy = username,
            Message = "The host has ended this watch party."
        });
    }
}
