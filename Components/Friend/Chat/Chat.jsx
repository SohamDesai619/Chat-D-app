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
  const { isFileMessage, parseFileData, isFileUploading, uploadProgress, sendFileMessage } = useContext(ChatAppContext);
  const [message, setMessage] = useState('');
  const [chatData, setChatData] = useState({
    name: "",
    address: "",
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const emojiPickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const router = useRouter();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [friendMsg]);

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
    
    // Call the function passed from parent component
    functionName({
      msg: message,
      address: chatData.address
    });
    
    // Clear the message field
    setMessage("");
  };
  
  const handleSendFile = async () => {
    if (!selectedFile || !chatData.address) {
      console.log("No file selected or no recipient address");
      return;
    }
    
    try {
      console.log("Sending file:", selectedFile.name);
      console.log("To address:", chatData.address);
      
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
            <h4>{chatData.name || currentUserName}</h4>
            <p className={Style.show}>{chatData.address || currentUserAddress}</p>
          </div>
        </div>
      ) : null}

      <div className={Style.Chat_box}>
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
            onChange={(e) => setMessage(e.target.value)}
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
    </div>
  )
}

export default Chat