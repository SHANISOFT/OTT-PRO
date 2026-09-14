namespace OTTPro.Domain.Enums;

public enum UserRole
{
    User = 0,
    Moderator = 1,
    ContentManager = 2,
    Admin = 3,
    SuperAdmin = 4
}

public enum UserStatus
{
    Active = 0,
    Suspended = 1,
    Banned = 2
}

public enum MediaType
{
    Show = 0,
    Movie = 1,
    Episode = 2
}

public enum WatchStatus
{
    PlanToWatch = 0,
    Watching = 1,
    Completed = 2,
    Dropped = 3
}

public enum PostType
{
    Text = 0,
    Image = 1,
    Meme = 2,
    EpisodeReaction = 3
}

public enum ReactionType
{
    Like = 0,
    Love = 1,
    Haha = 2,
    Shocked = 3,
    Sad = 4,
    Fire = 5,
    Clap = 6,
    Angry = 7
}

public enum NotificationType
{
    Follow = 0,
    PostLike = 1,
    NewComment = 2,
    Mention = 3,
    PartyInvite = 4,
    EpisodeRelease = 5,
    PollStarted = 6,
    PollEnding = 7,
    Subscription = 8,
    System = 9
}

public enum PartyStatus
{
    Scheduled = 0,
    Active = 1,
    Ended = 2
}

public enum RoomRole
{
    Host = 0,
    CoHost = 1,
    Moderator = 2,
    Participant = 3
}

public enum PlaybackEventType
{
    Play = 0,
    Pause = 1,
    Seek = 2,
    Resume = 3,
    Buffering = 4,
    Completed = 5,
    Sync = 6
}

public enum PollType
{
    SingleChoice = 0,
    MultipleChoice = 1,
    YesNo = 2,
    Rating = 3,
    Prediction = 4,
    Elimination = 5,
    Winner = 6,
    BestPerformer = 7,
    MostIrritating = 8,
    EpisodeReaction = 9
}

public enum PollStatus
{
    Draft = 0,
    Active = 1,
    Closed = 2,
    Cancelled = 3
}

public enum SubscriptionTier
{
    Free = 0,
    Pro = 1,
    VIP = 2
}

public enum PaymentStatus
{
    Pending = 0,
    Completed = 1,
    Failed = 2,
    Refunded = 3
}

public enum ReportReason
{
    SpoilerWithoutTag = 0,
    Harassment = 1,
    HateSpeech = 2,
    Spam = 3,
    Inappropriate = 4
}

public enum ReportStatus
{
    Pending = 0,
    Reviewed = 1,
    Dismissed = 2,
    ActionTaken = 3
}
