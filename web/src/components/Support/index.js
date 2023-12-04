import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

import {Col, Divider, Row} from "antd";
import Link from '@docusaurus/Link';
import Title from "antd/es/typography/Title";

import nuqleus from '/static/img/nuqleus_landscape.png';
import frc from '/static/img/frc.png';
import esif from '/static/img/esif.png';
import zicer from '/static/img/zicer.png';

function Feature({svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
          <img width={100} src={svg} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function Support() {
  return (
        <div>
            <Divider orientation={"center"}>
                <Title level={3}>
                    Supported by
                </Title>
            </Divider>
            <div className={styles.container}>
                <div className={styles.nuqleus}>
                    <Link to="https://nuqleus.io/">
                        <img src={nuqleus}/>
                    </Link>
                </div>
                <div className={styles.support}>
                    <Link to="https://www.zicer.hr/?lang=en">
                        <img src={zicer}/>
                    </Link>
                </div>
                <div className={styles.support}>
                    <Link to="https://filrougecapital.com/">
                        <img src={frc}/>
                    </Link>
                </div>
                <div className={styles.esif}>
                    <img src={esif}/>
                </div>
            </div>
        </div>
  );
}
