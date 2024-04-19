import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';

const BlogsTitle = () => {
    return (
        <div className={styles.wrapper}>
            <div className={styles.installTitle}>
                <h1 className={styles.titleText}>
                    Check our blog
                </h1>
            </div>
        </div>
    );
}

export default BlogsTitle;
