#Documentation Observer Engine in ROSE

## Observers in v2
Observers mainly track clicks on an element classify the Interaction by that click target. More complex Observers even extract certain data about the interaction context e.g. who shared the liked status update. In v2 the LikeObserver can obtain an identifier for an StatusUpdate and other Observers, that require such an Id use the LikeObserver Pattern toi retrieve it. This shows that there is an underlying process of extration of a certain content entitiy e.g. status update.

### Mainly Track Relation to FBUsers
* FriendAccept
* FriendAdd
* FriendIgnore
* FriendNotNow
* Unfriend

### Mainly Track Contents(Status Updates, Pages, Comments/Mesages) and Sharers
* ChatActivated
* ChatTurnedOff

* LikeStatus
* PageLike
* PageUnlike

* Share
* UpdateStatus
* UpdateStatusPicture
* DeleteStatus

* DeleteComment

* HideActivity

## Additional Observers in v3
For v3 I propose a separation of
* classification and
* data extraction

### Classification


* Comment
* Message (chat)
* Upload photo/video (not as status update)
* Create event
* Respond to event invites.
