import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';
import { Avatar, Card } from 'antd';
import useBaseUrl from '@docusaurus/useBaseUrl';

const { Meta } = Card;

const Testimonial = (props) => {
    return (
        <div style={{height: '100%'}}>
            <Card className={styles.cardtestimonialwrapper}>
                <Meta
                    avatar={<Avatar style={{width: "100px", height: "auto"}} src={props.avatar}/>}
                    title={<h3 style={{marginBottom: 0}}>{props.name}</h3>}
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
                <div style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    paddingTop: "24px",
                    fontSize: "16px"
                }}>
                    {props.testimonial}
                </div>
            </Card>
        </div>
    );
}

export default Testimonial;