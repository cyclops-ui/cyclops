import React, { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { Card, Col, Row } from "antd";

import graph from "/static/img/productivity-graph.gif";

const Productivity = () => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [changed, setChanged] = useState(false);
  const [start, setStart] = useState(false);

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
    window.addEventListener("scroll", handleScroll);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (isVisible && !changed) {
      setChanged(true);
      setTimeout(() => setStart(true), 5000);
    }
  }, [isVisible]);

  return (
    <Row
      style={{ paddingTop: "50px", opacity: "0" }}
      ref={elementRef}
      className={isVisible ? styles.wrapper : ""}
    >
      <Col xs={{ span: 24, order: 2 }} lg={{ span: 11, offset: 2 }}>
        <Card className={styles.animationcard}>
          <img className={start ? styles.noneprodgif : ""} src={graph}></img>
        </Card>
      </Col>
      <Col
        xs={{ span: 15, offset: 6 }}
        lg={{ span: 8, offset: 0, order: 2 }}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h2 style={{ color: "#FFF", marginBottom: "10px" }}>
          <span style={{ color: "#fe8801" }}>
            Move faster and break fewer things
          </span>
        </h2>
        <ul style={{ color: "#FFF" }}>
          <h3>
            <li>
              <span style={{ color: "#FF8803" }}>Reduce</span> developer
              onboarding <span style={{ color: "#FF8803" }}>time</span>
            </li>
            <li>
              <span style={{ color: "#FF8803" }}>Supercharge</span> developer{" "}
              <span style={{ color: "#FF8803" }}>productivity</span> and iterate
              faster
            </li>
          </h3>
        </ul>
      </Col>
    </Row>
  );
};

export default Productivity;
