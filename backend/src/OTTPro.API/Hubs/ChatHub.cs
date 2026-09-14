using Microsoft.AspNetCore.SignalR;

namespace OTTPro.API.Hubs;

public class ChatHub : Hub
{
    private static readonly Dictionary<string, string> UserConnections = new();
    private static readonly object LockObj = new();

    public async Task RegisterUser(string userId)
    {
        lock (LockObj)
        {
            UserConnections[userId] = Context.ConnectionId;
        }

        await Clients.All.SendAsync("UserOnlineStatus", new { UserId = userId, IsOnline = true });
    }

    public async Task SendDirectMessage(string senderId, string senderUsername, string targetUserId, string message)
    {
        var msgObj = new
        {
            Id = Guid.NewGuid().ToString("N"),
            SenderId = senderId,
            SenderUsername = senderUsername,
            TargetUserId = targetUserId,
            Message = message,
            Timestamp = DateTime.UtcNow
        };

        string? targetConnectionId = null;
        lock (LockObj)
        {
            UserConnections.TryGetValue(targetUserId, out targetConnectionId);
        }

        if (!string.IsNullOrEmpty(targetConnectionId))
        {
            await Clients.Client(targetConnectionId).SendAsync("ReceiveDirectMessage", msgObj);
        }

        // Echo back to sender for confirmation
        await Clients.Caller.SendAsync("MessageSentConfirmation", msgObj);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        string? disconnectedUserId = null;
        lock (LockObj)
        {
            var item = UserConnections.FirstOrDefault(x => x.Value == Context.ConnectionId);
            if (!string.IsNullOrEmpty(item.Key))
            {
                disconnectedUserId = item.Key;
                UserConnections.Remove(item.Key);
            }
        }

        if (!string.IsNullOrEmpty(disconnectedUserId))
        {
            await Clients.All.SendAsync("UserOnlineStatus", new { UserId = disconnectedUserId, IsOnline = false });
        }

        await base.OnDisconnectedAsync(exception);
    }
}
