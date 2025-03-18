import React from "react";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

import landingCyclops from "/static/img/landing_cyclops.png";
import title from "/static/img/cyclops-title.png";

import yaml from "/static/img/yaml_background.png";

import Comparison from "../components/Comparison";
import Install from "../components/Install";
import Features from "../components/Features";
import Blogs from "../components/Blogs";
import Testimonials from "../components/Testimonials";
import Newsletter from "../components/Newsletter";

export default function Home() {
  return (
    <Layout
      title={`Developer friendly Kubernetes`}
      description="Deploy your K8s workloads through a UI"
    >
      <main>
        <div className={styles.landing}>
          <img
            style={{
              left: "10%",
              animationIterationCount: "1",
              animationDelay: "-16s",
              opacity: 0,
            }}
            className={styles.backgroundYaml}
            src={yaml}
          />
          <img
            style={{
              animationIterationCount: "1",
              animationDelay: "-12s",
              opacity: 0,
            }}
            className={styles.backgroundYaml}
            src={yaml}
          />
          <img
            style={{
              left: "-10%",
              animationIterationCount: "1",
              animationDelay: "-8s",
              opacity: 0,
            }}
            className={styles.backgroundYaml}
            src={yaml}
          />
          <img
            style={{
              left: "10%",
              animationIterationCount: "1",
              animationDelay: "-4s",
              opacity: 0,
            }}
            className={styles.backgroundYaml}
            src={yaml}
          />

          <img
            className={styles.backgroundYaml}
            src={yaml}
            style={{
              opacity: 0,
            }}
          />
          <img
            style={{
              left: "10%",
              animationDelay: "4s",
              opacity: 0,
            }}
            className={styles.backgroundYaml}
            src={yaml}
          />
          <img
            style={{
              animationDelay: "8s",
              opacity: 0,
            }}
            className={styles.backgroundYaml}
            src={yaml}
          />
          <img
            style={{
              left: "-10%",
              animationDelay: "12s",
              opacity: 0,
            }}
            className={styles.backgroundYaml}
            src={yaml}
          />

          <img className={styles.cyclopsTitle} src={title}/>
          <h2 className={styles.cyclopsDesc}>Developer friendly Kubernetes</h2>
          <img className={styles.landingCyclops} src={landingCyclops}/>
          <button
            onClick={() => {
              window.location.href = "/docs/installation/install/manifest"
            }}
            className={styles.readTheDocs}
          >
            <h3 style={{margin: "0px 20px 0px 20px"}}>Get started</h3>
          </button>
          <a
            href={
              "https://www.producthunt.com/posts/cyclops-3?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-cyclops&#0045;3"
            }
            target={"_blank"}
            style={{ zIndex: "1", margin: "15px" }}
          >
            <img
              src={
                "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=934878&theme=light&t=1741601107320"
              }
              alt="Cyclops - Open&#0045;Source&#0032;tool&#0032;for&#0032;building&#0032;Internal&#0032;Developer&#0032;Platforms | Product Hunt"
              style={{ width: "250px", height: "54px" }}
              width={"250"}
              height={"54"}
            />
          </a>
          </div>
        <Comparison/>
        <div className={styles.backgroundcolor}>
          <Features />
          <Testimonials />
          <Install />
          <Blogs />
          <Newsletter />
        </div>
      </main>
    </Layout>
  );
}
