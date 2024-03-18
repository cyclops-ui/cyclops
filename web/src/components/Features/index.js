import React, {useEffect, useState} from 'react';
import styles from './styles.module.css';
import FeaturesTitle from "./Title";
import Validations from "./Validations";

const Features = () => {
    return (
        <div className={styles.install}>
            <FeaturesTitle/>
            <Validations/>
        </div>
    );
}

export default Features;
