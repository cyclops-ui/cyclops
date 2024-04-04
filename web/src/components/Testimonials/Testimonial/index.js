import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';
import { Avatar, Card } from 'antd';
import useBaseUrl from '@docusaurus/useBaseUrl';

const { Meta } = Card;

const Testimonial = (props) => {
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
        <div style={{opacity: 0, height: '100%'}} ref={elementRef} className={isVisible ? styles.testimonialwrapper : ''}>
            <Card className={styles.cardtestimonialwrapper}>
                    <Meta
                        avatar={<Avatar style={{width: "100px", height: "auto"}} src={props.avatar}/>}
                        title={<div>{props.name} {props.icon}</div>}
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
                                {props.position}
                            </div>
                        }
                    />
                    <div style={{height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: "24px"}}>
                        {props.testimonial}
                    </div>
            </Card>
        </div>
    );
}

export default Testimonial;