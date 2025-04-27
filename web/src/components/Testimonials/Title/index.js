import React from 'react';
import styles from './styles.module.css';

const TestimonialsTitle = () => {
    return (
        <div className={styles.wrapper}>
            <div className={styles.installTitle}>
                <h1 className={styles.titleText}>
                    Their <span style={{color: "#ff8803"}}>words</span>, not ours
                </h1>
            </div>
        </div>
    );
}

export default TestimonialsTitle;
