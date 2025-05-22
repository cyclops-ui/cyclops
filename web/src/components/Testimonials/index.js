import React, {useState} from 'react';
import styles from './styles.module.css';
import TestimonialsTitle from "./Title";

import Col from "antd/es/col"
import Row from "antd/es/row"
import { Card } from 'antd';

const Testimonials = () => {
    const testimonials = [
        {
            name: "Kunal",
            position: "DevRel manager at Civo",
            testimonial: "Deploying has never been easier: A single interface to manage your workloads on Kubernetes. 🔥 An easy way to get started on Kubernetes👌"
        },
        {
            name: "Rosana",
            position: "AWS Container Hero",
            testimonial: "Cyclops has transformed my Kubernetes management experience. Its intuitive form-based UI and Helm integration make deploying and monitoring applications straightforward and error-free. A must-try tool for anyone looking to simplify their Kubernetes operations!"
        },
        {
            name: "Ken",
            position: "VP, DevOps",
            testimonial: "Cyclops utilizes Helm charts for application deployment, making Kubernetes more accessible to users with different levels of expertise."
        },
        {
            name: "Adolfo",
            position: "SRE/DevOps",
            testimonial: "I enjoyed using cyclops because of it's simplicity and enhanced observability of kubernetes clusters as well as the seamless integrations with tools like  prometheus and Grafana",
        },
        {
            name: "Hanzel",
            position: "DevOps Engineer",
            testimonial: "I've been using Cyclops for a few months now in my projects to streamline the creation of applications in Kubernetes, and the experience has been excellent. I find the interface very intuitive, and the integration with Helm has significantly simplified the deployment process, allowing me to focus more on development rather than configuration. I've also recommended Cyclops to several friends who don't have extensive knowledge of Kubernetes, and they've found the tool incredibly useful for creating applications easily and without complications. I truly appreciate the work you and your team are doing with Cyclops, and I'm very excited to see how it evolves in the future.",
        },
        {
            name: "Rodrigo",
            position: "Senior DevOps Engineer",
            testimonial: "I actually installed it and showed it in a presentation about how to create Internal Developers Portal. It was an example on how to use a ready to use product instead of using a framework like backstage. I found it very easy to understand and use, congratulations on getting it there 👏",
        },
        {
          name: "Jesus",
          position: "Software Developer",
          testimonial: "Cyclops does an amazing job of simplifying the complexities of Kubernetes while boosting developer efficiency.",
        },
        {
          name: "Hanshal",
          position: "DevOps",
          testimonial: "It's a really nice tool to manage and deploy Kubernetes.",
        },
        {
          name: "Jurica",
          position: "Software Engineer",
          testimonial: "Love the tool! Helps me navigate the k8s mess a lot more easily.",
        },
        {
          name: "Ajay",
          position: "Developer/DevOps Engineer",
          testimonial: "Amazing! Easy to use! A must-try tool to simplify their k8s operations! Loved it!",
        },
        {
          name: "Anmol",
          position: "Software Developer (Blockchain Dev)",
          testimonial: "I really like the idea of Cyclops. It is so much easier for users who dont know or need to know about k8s. Why did this not exist before?",
        },
        {
          name: "Raj",
          position: "Software Developer",
          testimonial: "I'm really impressed with the Cyclops UI so far. The community seems active and supportive, which is fantastic.",
        },
        {
            name: "David",
            position: "SRE/DevOps",
            testimonial: "I really like it. I've been using it in my personal lab environments, and it's been excellent. I've also recommended it to a couple of friends who manage Kubernetes, and they've found it very useful as well.",
        },
        {
            name: "Sergio",
            position: "SRE",
            testimonial: "Great project that cyclops UI is really like (as an SRE) a straighfoward way to create modules for dev teams without really in more complex ways. awesome work for the community",
        },
        {
            name: "Prince",
            position: "Software Engineer",
            testimonial: "I'm impressed with its functionality. It worked seamlessly with a Minikube cluster, and I particularly loved the edit feature for modifying images and replicas. The rollback feature also stood out as a fantastic addition, making deployments much easier to manage.",
        },
        {
            name: "Edgar",
            position: "DevOps",
            testimonial: "I did a quick demo to my students to show they how easy is deploy applications using cyclops. (It's a technology institute, and I teach classes for a DevOps bootcamp.)",
        },
        {
            name: "Kaan",
            position: "R&D Engineer",
            testimonial: "I'm impressed by how it simplifies Kubernetes management and service orchestration. As a small company without a dedicated DevOps team, we understand the importance of user-friendly tools that don't require extensive specialized knowledge. What makes Cyclops perfect for us is its ability to simplify the management of various services. We're working on implementing CNCF products like APISIX, Keycloak, OpenFGA, Prometheus, and Grafana, and Cyclops could be a game-changer in how we handle these integrations.",
        },
        {
            name: "Ashish",
            position: "Engineer",
            testimonial: "Cyclops is awesome, makes Kubernetes easy for devs.",
        }
        ]

    const column1Testimonials = testimonials.slice(0, 6);
    const column2Testimonials = testimonials.slice(6, 12);
    const column3Testimonials = testimonials.slice(12, 18);

    const [isHovered, setIsHovered] = useState({
        col1: false,
        col2: false,
        col3: false
    });

    const handleMouseEnter = (column) => {
        setIsHovered(prev => ({
            ...prev,
            [column]: true
        }));
    };

    const handleMouseLeave = (column) => {
        setIsHovered(prev => ({
            ...prev,
            [column]: false
        }));
    };

    const renderTestimonialColumn = (testimonials, columnKey) => {
        return (
            <div
                onMouseEnter={() => handleMouseEnter(columnKey)}
                onMouseLeave={() => handleMouseLeave(columnKey)}
                className={styles.testimonialColumn}
            >
                <div
                    className={`${styles.testimonialContent} ${styles[`column${columnKey.slice(-1)}`]} ${isHovered[columnKey] ? styles.paused : ''}`}
                >
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={`${columnKey}-1-${index}`}
                            style={{
                                padding: '10px',
                                marginBottom: '20px',
                            }}
                        >
                            <Card
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    minHeight: '200px',
                                }}
                            >
                                <p style={{ 
                                    fontSize: '1.2em', 
                                    fontStyle: 'italic',
                                    marginBottom: '20px',
                                    lineHeight: '1.6'
                                }}>
                                    "{testimonial.testimonial}"
                                </p>
                                <div style={{ 
                                    marginTop: 'auto',
                                    paddingTop: '20px',
                                    borderTop: '1px solid #f0f0f0'
                                }}>
                                    <strong>{testimonial.name}</strong>
                                    <br />
                                    <span style={{ color: '#666' }}>{testimonial.position}</span>
                                </div>
                            </Card>
                        </div>
                    ))}
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={`${columnKey}-2-${index}`}
                            style={{
                                padding: '10px',
                                marginBottom: '20px',
                            }}
                        >
                            <Card
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    minHeight: '200px',
                                }}
                            >
                                <p style={{ 
                                    fontSize: '1.2em', 
                                    fontStyle: 'italic',
                                    marginBottom: '20px',
                                    lineHeight: '1.6'
                                }}>
                                    "{testimonial.testimonial}"
                                </p>
                                <div style={{ 
                                    marginTop: 'auto',
                                    paddingTop: '20px',
                                    borderTop: '1px solid #f0f0f0'
                                }}>
                                    <strong>{testimonial.name}</strong>
                                    <br />
                                    <span style={{ color: '#666' }}>{testimonial.position}</span>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.featuresroot}>
            <div className={styles.features}>
                <Row align="middle">
                    <TestimonialsTitle/>
                </Row>
                <Row gutter={[16, 16]} style={{ height: '700px', overflow: 'hidden' }}>
                    <Col xs={24} sm={24} md={8}>
                        {renderTestimonialColumn(column1Testimonials, 'col1')}
                    </Col>
                    <Col xs={0} sm={0} md={8}>
                        {renderTestimonialColumn(column2Testimonials, 'col2')}
                    </Col>
                    <Col xs={0} sm={0} md={8}>
                        {renderTestimonialColumn(column3Testimonials, 'col3')}
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default Testimonials;
