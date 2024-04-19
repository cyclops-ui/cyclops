import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';
import { Avatar, Card } from 'antd';
import useBaseUrl from '@docusaurus/useBaseUrl';

const { Meta } = Card;

const Blog = (props) => {
    return (
        <div>
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