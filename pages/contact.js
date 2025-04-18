import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Style from './static.module.css'
import images from '../assets'

const Contact = () => {
  return (
    <div className={Style.container}>
      <div className={Style.header}>
        <h1>Contact Us</h1>
        <p>We'd love to hear from you. Reach out with any questions or feedback.</p>
      </div>
      
      <div className={Style.content}>
        <div className={Style.contactForm}>
          <h2>Send us a message</h2>
          <form>
            <div className={Style.formGroup}>
              <label>Name</label>
              <input type="text" placeholder="Your name" />
            </div>
            
            <div className={Style.formGroup}>
              <label>Email</label>
              <input type="email" placeholder="Your email address" />
            </div>
            
            <div className={Style.formGroup}>
              <label>Subject</label>
              <input type="text" placeholder="What is this regarding?" />
            </div>
            
            <div className={Style.formGroup}>
              <label>Message</label>
              <textarea placeholder="Your message..." rows={5}></textarea>
            </div>
            
            <button className={Style.submitBtn}>
              Send Message
            </button>
          </form>
        </div>
        
        <div className={Style.contactInfo}>
          <h2>Other ways to connect</h2>
          
          <div className={Style.infoItem}>
            <div className={Style.infoIcon}>
              <Image src={images.accountName} alt="Email" width={30} height={30} />
            </div>
            <div>
              <h3>Email</h3>
              <p>support@chatdapp.io</p>
            </div>
          </div>
          
          <div className={Style.infoItem}>
            <div className={Style.infoIcon}>
              <Image src={images.accountName} alt="Location" width={30} height={30} />
            </div>
            <div>
              <h3>Location</h3>
              <p>123 Blockchain Street, Crypto Valley, Web3 City</p>
            </div>
          </div>
          
          <div className={Style.socialLinks}>
            <h3>Follow us</h3>
            <div className={Style.socialIcons}>
              <Link href="https://twitter.com" target="_blank">
                <Image src={images.accountName} alt="Twitter" width={30} height={30} />
              </Link>
              <Link href="https://github.com" target="_blank">
                <Image src={images.accountName} alt="GitHub" width={30} height={30} />
              </Link>
              <Link href="https://discord.com" target="_blank">
                <Image src={images.accountName} alt="Discord" width={30} height={30} />
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className={Style.footer}>
        <Link href="/">
          <button className={Style.backBtn}>Back to Chat</button>
        </Link>
      </div>
    </div>
  )
}

export default Contact 