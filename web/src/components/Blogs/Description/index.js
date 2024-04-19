import React from 'react';
import styles from './styles.module.css';

const BlogsDescription = () => {
    return (
        <div style={{paddingTop: 0}} className={styles.wrapper}>
            <div className={styles.installTitle}>
                <h3 className={styles.descText}>
                    We are working on a blog post series covering topics from general open source challenges to specific Kubernetes related topics. <span style={{color: "#fe8803"}}>Check it out!</span>
                </h3>
            </div>
        </div>
    );
}

export default BlogsDescription;
