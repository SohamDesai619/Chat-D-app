import React, {useState, useEffect, useRef} from 'react'
import Image from 'next/image'
import Style from "./Chat.module.css"
import { useRouter } from 'next/router'
import images from "../../../assets"
import EmojiPicker from 'emoji-picker-react'
import { Loader } from '@/Components/index1'

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
  const [message, setMessage] = useState('');
  const [chatData, setChatData] = useState({
    name: "",
    address: "",
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  
  const router = useRouter();

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
    // Check if we have a message and a recipient address
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

  const handleEmojiClick = (emojiObject) => {
    setMessage(prevMsg => prevMsg + emojiObject.emoji);
    // Optional: close the picker after selecting, or leave it open
    // setShowEmojiPicker(false);
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
              return (
                <div 
                  key={i} 
                  className={`${Style.message_item} ${isMyMessage ? Style.my_message : Style.other_message}`}
                >
                  <div className={Style.message_content}>
                    <span className={Style.sender_name}>
                      {isMyMessage ? userName : chatData.name}
                    </span>
                    {el.msg && <p>{el.msg}</p>}
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
        </div>
      </div>

      <div className={Style.Chat_box_send}>
        <div className={Style.Chat_box_send_img}>
          <div className={Style.emoji_container} ref={emojiPickerRef}>
            <div className={Style.emoji_btn} onClick={toggleEmojiPicker}>
              <Image 
                src={images.smile}
                alt='smile'
                width={40}
                height={40}
                className={Style.Smiley_img}
              />
            </div>
            {showEmojiPicker && (
              <div className={Style.emoji_picker_container}>
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          <input 
            type='text'
            placeholder='Type your message..'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <Image 
            src={images.file}
            alt='file'
            width={40}
            height={40} 
            className={Style.File_img}
          />
          {loading ? (
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