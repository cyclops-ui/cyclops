import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';

const BlogsDescription = () => {
    const elementRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (elementRef.current) {
                const top = elementRef.current.getBoundingClientRect().top;
                const windowHeight = window.innerHeight;
                setIsVisible(top < windowHeight);
            }
        };

        // Initial check when component mounts
        handleScroll();

        // Event listener for scroll
        window.addEventListener('scroll', handleScroll);

        // Cleanup
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div ref={elementRef} style={{opacity: "0", paddingTop: 0}} className={isVisible ? styles.wrapper : ''}>
            <div className={styles.installTitle}>
                <h3 className={styles.descText}>
                    We are working on a blog post series covering topics from general open source challenges to specific Kubernetes related topics. <span style={{color: "#fe8803"}}>Check it out!</span>
                </h3>
            </div>
        </div>
    );
}

export default BlogsDescription;
