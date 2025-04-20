import React, {useState, useEffect, useRef} from 'react'
import Image from 'next/image'
import Style from "./Chat.module.css"
import { useRouter } from 'next/router'
import images from "../../../assets"
import EmojiPicker from 'emoji-picker-react'
import { Loader } from '@/Components/index1'
import FileInput from '@/Components/FileInput'
import FileMessage from '@/Components/FileMessage'
import UploadProgress from '@/Components/UploadProgress'
import { useContext } from 'react'
import { ChatAppContext } from '@/Context/ChatAppContext'
import OnlineStatus from '@/Components/OnlineStatus/OnlineStatus'
import socketService from '@/Utils/socketService'

const Chat = ({
  functionName,
  readMessage,
  friendMsg,
  account,
  userName,
  loading,
  currentUserName,
  currentUserAddress,
  readUser,
}) => {
  const { 
    isFileMessage, 
    parseFileData, 
    isFileUploading, 
    uploadProgress, 
    sendFileMessage,
    onlineUsers,
    typingUsers 
  } = useContext(ChatAppContext);
  
  const [message, setMessage] = useState('');
  const [chatData, setChatData] = useState({
    name: "",
    address: "",
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [prevMsgLength, setPrevMsgLength] = useState(0);
  
  const emojiPickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatBoxRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const router = useRouter();

  // Improved scroll behavior to maintain position when viewing old messages
  useEffect(() => {
    // If no previous messages existed (first load), always scroll to bottom
    if (prevMsgLength === 0 && friendMsg.length > 0) {
      scrollToBottom();
      setPrevMsgLength(friendMsg.length);
      return;
    }
    
    // If new messages were added, check if we should auto-scroll
    if (friendMsg.length > prevMsgLength) {
      if (shouldScrollToBottom) {
        scrollToBottom();
      }
      setPrevMsgLength(friendMsg.length);
    }
  }, [friendMsg, shouldScrollToBottom, prevMsgLength]);
  
  // Function to manually scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Track scroll position to determine if user is at bottom
  useEffect(() => {
    const handleScroll = () => {
      if (!chatBoxRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = chatBoxRef.current;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
      
      setShouldScrollToBottom(isAtBottom);
    };
    
    const chatBox = chatBoxRef.current;
    if (chatBox) {
      chatBox.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (chatBox) {
        chatBox.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

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

  // Load chat data when router is ready
  useEffect(() => {
    if (!router.isReady) return;
    
    const address = router.query.address;
    const name = router.query.name;
    
    console.log("Router query:", router.query);
    console.log("Setting chat data - address:", address, "name:", name);
    
    setChatData({
      name: name || "",
      address: address || ""
    });
    
    if (address) {
      console.log("Reading messages for address:", address);
      readMessage(address);
      readUser(address);
    }
  }, [router.isReady, router.query, readMessage, readUser]);
  
  // Handle typing indicator
  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    // If recipient address is available, send typing indicator
    if (chatData.address) {
      // Clear previous timeout if it exists
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Send typing indicator if it's not already sent
      if (!isTyping) {
        setIsTyping(true);
        socketService.sendTypingIndicator(account, chatData.address, true);
      }
      
      // Set a timeout to clear typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketService.sendTypingIndicator(account, chatData.address, false);
      }, 3000);
    }
  };
  
  // Check if the recipient is currently typing
  const isRecipientTyping = () => {
    return typingUsers && typingUsers[chatData.address] === true;
  };
  
  // Get recipient's online status
  const getRecipientOnlineStatus = () => {
    if (!chatData.address || !onlineUsers) return { isOnline: false };
    return onlineUsers[chatData.address] || { isOnline: false };
  };

  // Format date correctly
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    
    const date = new Date(Number(timestamp) * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  const handleSendMessage = () => {
    // If there's a file selected, send it as a file message
    if (selectedFile) {
      handleSendFile();
      return;
    }
    
    // Otherwise send a regular text message
    if (message.trim() === "") {
      console.log("Message is empty");
      return;
    }
    
    if (!chatData.address) {
      console.log("No recipient address found");
      return;
    }
    
    console.log("Sending message:", message);
    console.log("To address:", chatData.address);
    
    // Set scroll to bottom for when our own message appears
    setShouldScrollToBottom(true);
    
    // Call the function passed from parent component
    functionName({
      msg: message,
      address: chatData.address
    });
    
    // Clear the message field and typing indicator
    setMessage("");
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketService.sendTypingIndicator(account, chatData.address, false);
  };
  
  const handleSendFile = async () => {
    if (!selectedFile || !chatData.address) {
      console.log("No file selected or no recipient address");
      return;
    }
    
    try {
      console.log("Sending file:", selectedFile.name);
      console.log("To address:", chatData.address);
      
      // Set scroll to bottom for when our file message appears
      setShouldScrollToBottom(true);
      
      const result = await sendFileMessage({
        file: selectedFile,
        address: chatData.address
      });
      
      if (result && result.success) {
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("Error sending file:", error);
    }
  };
  
  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage(prevMsg => prevMsg + emojiObject.emoji);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prev => !prev);
  };

  const isSender = (address) => {
    if (!account || !address) return false;
    return address.toLowerCase() === account.toLowerCase();
  };

  return (
    <div className={Style.Chat}>
      {currentUserName && currentUserAddress ? (
        <div className={Style.Chat_user_info}>
          <Image 
            src={images.accountName} 
            alt="image" 
            width={30}
            height={30} 
          />
          <div className={Style.Chat_user_info_box}>
            <h4>
              {chatData.name || currentUserName}
              <span className={Style.online_status_wrapper}>
                <OnlineStatus 
                  isOnline={getRecipientOnlineStatus().isOnline} 
                  lastSeen={getRecipientOnlineStatus().lastSeen}
                  size="sm"
                />
              </span>
            </h4>
            <p className={Style.show}>{chatData.address || currentUserAddress}</p>
            
            {isRecipientTyping() && (
              <p className={Style.typing_indicator}>typing...</p>
            )}
          </div>
        </div>
      ) : null}

      <div className={Style.Chat_box} ref={chatBoxRef}>
        <div className={Style.Chat_box_left}>
          {friendMsg.length > 0 ? (
            friendMsg.map((el, i) => {
              const isMyMessage = isSender(el.sender);
              const isFileMsgData = isFileMessage(el.msg);
              
              return (
                <div 
                  key={i} 
                  className={`${Style.message_item} ${isMyMessage ? Style.my_message : Style.other_message}`}
                >
                  <div className={Style.message_content}>
                    <span className={Style.sender_name}>
                      {isMyMessage ? userName : chatData.name}
                    </span>
                    
                    {isFileMsgData ? (
                      <FileMessage fileData={parseFileData(el.msg)} />
                    ) : (
                      <p>{el.msg}</p>
                    )}
                    
                    <span className={Style.message_time}>
                      {formatDate(el.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={Style.no_messages}>
              <p>No messages yet. Start a conversation!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* File upload progress indicator */}
      {isFileUploading && (
        <div className={Style.upload_progress_container}>
          <p className={Style.uploading_text}>Uploading file...</p>
          <UploadProgress progress={uploadProgress} />
        </div>
      )}

      <div className={Style.Chat_box_send}>
        <div className={Style.Chat_box_send_img}>
          <div className={Style.input_actions}>
            <div className={Style.emoji_container} ref={emojiPickerRef}>
              <div className={Style.emoji_btn} onClick={toggleEmojiPicker} title="Add emoji">
                <div className={Style.emojiIconWrapper}>
                  <Image 
                    src={images.smile}
                    alt='smile'
                    width={30}
                    height={30}
                    className={Style.emojiIcon}
                  />
                </div>
              </div>
              {showEmojiPicker && (
                <div className={Style.emoji_picker_container}>
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
            </div>
            
            <FileInput 
              onFileSelect={handleFileSelect}
              disabled={loading || isFileUploading}
            />
          </div>
          
          <input 
            type='text'
            placeholder={selectedFile ? 'Press send to upload file' : 'Type your message..'}
            value={message}
            onChange={handleTyping}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            disabled={loading || isFileUploading || selectedFile}
          />
          
          {loading || isFileUploading ? (
            <Loader />
          ) : (
            <Image 
              src={images.send}
              alt='send'
              width={40}
              height={40} 
              onClick={handleSendMessage}
              className={Style.send_img} 
            />
          )}
        </div>
      </div>
      
      {/* Scroll to bottom button - only show when not at bottom */}
      {!shouldScrollToBottom && friendMsg.length > 0 && (
        <button 
          className={Style.scroll_to_bottom_btn}
          onClick={() => {
            setShouldScrollToBottom(true);
            scrollToBottom();
          }}
          title="Scroll to latest messages"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 13L12 18L17 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 6L12 11L17 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}

export default Chat