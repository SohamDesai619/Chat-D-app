import React, { useState, useEffect, useContext, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Style from "./groupchat.module.css"
import { ChatAppContext } from '@/Context/ChatAppContext'
import images from '../assets'
import EmojiPicker from 'emoji-picker-react'

const GroupChat = () => {
  const { 
    account, 
    userName, 
    friendLists, 
    loading,
    error,
    myGroups,
    createGroup,
    getGroupDetails,
    getGroupMessages,
    sendGroupMessage,
    currentGroupId,
    currentGroupName,
    currentGroupMembers,
    currentGroupMessages,
    setCurrentGroupId
  } = useContext(ChatAppContext)

  // States for UI
  const [message, setMessage] = useState("")
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedFriends, setSelectedFriends] = useState([])
  const [localError, setLocalError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiPickerRef = useRef(null)
  
  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [emojiPickerRef]);
  
  // Load groups effect
  useEffect(() => {
    console.log("Available groups:", myGroups);
    if (myGroups.length > 0 && !currentGroupId) {
      loadGroupDetails(myGroups[0]);
    }
  }, [myGroups]);
  
  // Effect to handle context error
  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);
  
  // Load group details and messages
  const loadGroupDetails = async (groupId) => {
    try {
      setIsLoading(true);
      console.log("Loading details for group:", groupId);
      await getGroupDetails(groupId);
      await getGroupMessages(groupId);
      setCurrentGroupId(groupId);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading group details:", error);
      setLocalError("Error loading group information. Please try again.");
      setIsLoading(false);
    }
  }
  
  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (message.trim() === "") {
      setLocalError("Message cannot be empty");
      return;
    }
    
    try {
      setLocalError("");
      console.log("Sending message to group:", currentGroupId);
      await sendGroupMessage({
        groupId: currentGroupId,
        msg: message
      });
      
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setLocalError("Failed to send message. Please try again.");
    }
  }
  
  // Handle emoji selection
  const handleEmojiClick = (emojiObject) => {
    setMessage(prevMsg => prevMsg + emojiObject.emoji);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prev => !prev);
  };
  
  // Handle group selection
  const handleSelectGroup = (groupId) => {
    setLocalError("");
    loadGroupDetails(groupId);
  }
  
  // Handle creating a new group
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    if (newGroupName.trim() === "") {
      setLocalError("Group name cannot be empty");
      return;
    }
    
    if (selectedFriends.length === 0) {
      setLocalError("Please select at least one friend to add to the group");
      return;
    }
    
    try {
      setLocalError("");
      console.log("Creating group:", newGroupName);
      console.log("Selected friends:", selectedFriends);
      
      await createGroup({
        name: newGroupName,
        members: selectedFriends
      });
      
      setShowCreateGroup(false);
      setNewGroupName("");
      setSelectedFriends([]);
    } catch (error) {
      console.error("Error creating group:", error);
      setLocalError("Failed to create group. Please try again.");
    }
  }
  
  // Toggle friend selection for group creation
  const toggleFriendSelection = (friendAddress) => {
    if (selectedFriends.includes(friendAddress)) {
      setSelectedFriends(selectedFriends.filter(addr => addr !== friendAddress));
    } else {
      setSelectedFriends([...selectedFriends, friendAddress]);
    }
  }
  
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className={Style.groupchat}>
      <div className={Style.groupchat_box}>
        <div className={Style.groupchat_box_header}>
          <h2>Group Chatting</h2>
          <p>Connect with multiple users at once</p>
        </div>
        
        {/* Error message display */}
        {(localError || error) && (
          <div className={Style.error_container}>
            <p className={Style.error_message}>{localError || error}</p>
            <button onClick={() => setLocalError("")} className={Style.error_close}>×</button>
          </div>
        )}
        
        <div className={Style.groupchat_box_container}>
          {/* Left sidebar - Group list */}
          <div className={Style.groupchat_box_sidebar}>
            <div className={Style.groupchat_box_sidebar_header}>
              <h3>My Groups</h3>
              <button 
                className={Style.create_group_btn}
                onClick={() => setShowCreateGroup(!showCreateGroup)}
              >
                {showCreateGroup ? "Cancel" : "Create Group"}
              </button>
            </div>
            
            {showCreateGroup ? (
              <div className={Style.create_group_form}>
                <input 
                  type="text"
                  placeholder="Group Name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                
                <h4>Select Friends ({selectedFriends.length} selected)</h4>
                <div className={Style.friend_selection_list}>
                  {friendLists.length > 0 ? (
                    friendLists.map((friend, i) => (
                      <div key={i} className={Style.friend_selection_item}>
                        <input 
                          type="checkbox"
                          id={`friend-${i}`}
                          checked={selectedFriends.includes(friend.pubkey)}
                          onChange={() => toggleFriendSelection(friend.pubkey)}
                        />
                        <label htmlFor={`friend-${i}`}>{friend.name}</label>
                      </div>
                    ))
                  ) : (
                    <p className={Style.no_friends_message}>
                      You need to add friends first. <a href="/alluser">Go to All Users</a>
                    </p>
                  )}
                </div>
                
                <button 
                  className={Style.create_group_submit_btn}
                  onClick={handleCreateGroup}
                  disabled={newGroupName.trim() === "" || selectedFriends.length === 0 || loading || isLoading}
                >
                  {loading ? "Creating..." : "Create Group"}
                </button>
              </div>
            ) : (
              <div className={Style.group_list}>
                {myGroups.length > 0 ? (
                  myGroups.map((groupId, i) => (
                    <div 
                      key={i} 
                      className={`${Style.group_item} ${currentGroupId === groupId ? Style.active_group : ""}`}
                      onClick={() => handleSelectGroup(groupId)}
                    >
                      <div className={Style.group_icon}>
                        <Image src={images.accountName} alt="Group" width={30} height={30} />
                      </div>
                      <div className={Style.group_info}>
                        <h4>{currentGroupId === groupId && currentGroupName ? currentGroupName : `Group ${groupId}`}</h4>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={Style.no_groups_message}>No groups yet. Create one!</p>
                )}
              </div>
            )}
          </div>
          
          {/* Right side - Chat area */}
          <div className={Style.groupchat_box_chat}>
            {currentGroupId ? (
              <>
                <div className={Style.chat_header}>
                  <h3>{currentGroupName || `Group ${currentGroupId}`}</h3>
                  <p>{currentGroupMembers.length} members</p>
                </div>
                
                <div className={Style.chat_messages}>
                  {isLoading || loading ? (
                    <div className={Style.loading_container}>
                      <p className={Style.loading_message}>Loading messages...</p>
                    </div>
                  ) : currentGroupMessages.length > 0 ? (
                    currentGroupMessages.map((msg, i) => (
                      <div 
                        key={i} 
                        className={`${Style.message_item} ${msg.sender.toLowerCase() === account.toLowerCase() ? Style.my_message : ""}`}
                      >
                        <div className={Style.message_content}>
                          <span className={Style.sender_name}>{msg.senderName}</span>
                          <p>{msg.msg}</p>
                          <span className={Style.message_time}>{formatTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={Style.no_messages}>No messages yet. Start the conversation!</p>
                  )}
                </div>
                
                <form className={Style.message_input_form} onSubmit={handleSendMessage}>
                  <div className={Style.message_input_wrapper}>
                    <div className={Style.emoji_container} ref={emojiPickerRef}>
                      <div className={Style.emoji_btn} onClick={toggleEmojiPicker}>
                        <Image src={images.smile} alt="Emoji" width={30} height={30} />
                      </div>
                      {showEmojiPicker && (
                        <div className={Style.emoji_picker_container}>
                          <EmojiPicker onEmojiClick={handleEmojiClick} />
                        </div>
                      )}
                    </div>
                    <input 
                      type="text"
                      placeholder="Type your message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={loading || isLoading}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={message.trim() === "" || loading || isLoading}
                  >
                    {loading ? "Sending..." : "Send"}
                  </button>
                </form>
              </>
            ) : (
              <div className={Style.groupchat_box_content_message}>
                <p>{myGroups.length > 0 ? "Select a group to start chatting" : "Create a group to start chatting"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GroupChat 