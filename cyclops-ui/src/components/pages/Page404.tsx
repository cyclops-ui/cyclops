import PathConstants from "../../routes/PathConstants";
import Sider from "antd/es/layout/Sider";
import SideNav from "../layouts/sidebar";
import {Layout} from "antd";
import {Content, Header} from "antd/es/layout/layout";
import React, {Suspense} from "react";
import {Outlet} from "react-router-dom";

export default function Page404() {
    return (
        <Layout>
            <Sider>
                <SideNav/>
            </Sider>
            <Layout>
                <Header/>
                <Content style={{margin: '24px 16px', padding: 24, minHeight: "calc(100vh - 112px)", background: "#fff"}}>
                    <h1 style={{
                        verticalAlign: "center",
                        textAlign: "center"
                    }}>Page not found :/</h1>
                </Content>
            </Layout>
        </Layout>
    )
}