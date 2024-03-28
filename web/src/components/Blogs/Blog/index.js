import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';
import { Avatar, Card } from 'antd';
import useBaseUrl from '@docusaurus/useBaseUrl';

const { Meta } = Card;

const Blog = (props) => {
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
        <div style={{opacity: 0}} ref={elementRef} className={isVisible ? styles.blogwrapper : ''}>
            <a
                href={props.blogLink}
            >
                <Card
                    className={styles.blogcard}
                    cover={
                        <img style={{ height: 200, objectFit: 'cover' }} src={useBaseUrl(props.banner)}/>
                    }
                >
                    <Meta
                        avatar={<Avatar src={props.avatar}/>}
                        title={props.title}
                        description={
                            <div
                                style={{
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    "-webkit-line-clamp": 3,
                                    "-webkit-box-orient": "vertical",
                                }}
                            >
                                {props.description}
                            </div>
                        }
                    />
                </Card>
            </a>
        </div>
    );
}

export default Blog;