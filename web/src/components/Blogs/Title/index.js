import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';

const BlogsTitle = () => {
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
        <div ref={elementRef} style={{opacity: "0"}} className={isVisible ? styles.wrapper : ''}>
            <div className={styles.installTitle}>
                <h1 className={styles.titleText}>
                    Check our blog
                </h1>
            </div>
        </div>
    );
}

export default BlogsTitle;