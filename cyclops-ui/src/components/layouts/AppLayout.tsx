import {Outlet} from "react-router-dom";
import SideNav from "./Sidebar";
import {Suspense} from "react";
import Sider from "antd/es/layout/Sider";
import {Content, Header} from "antd/es/layout/layout";
import {Button, Layout} from 'antd';
import {BugFilled} from "@ant-design/icons";

export default function AppLayout() {
    return (
        <Layout>
            <Sider>
                <SideNav/>
            </Sider>
            <Layout>
                <>
                    <Header style={{ display: 'flex', alignItems: 'center'}} >
                        <Button
                            style={{ marginLeft: 'auto' }}
                            icon={ <BugFilled/> }
                            href={"https://github.com/cyclops-ui/cyclops/issues/new?assignees=&labels=&projects=&template=bug_report.md&title="}
                        />
                    </Header>
                </>
                <Content style={{margin: '24px 16px', padding: 24, minHeight: "calc(100vh - 112px)", background: "#fff"}}>
                    <Suspense fallback={<h1 style={{textAlign: "center"}}>Loading...</h1>}>
                        <Outlet/>
                    </Suspense>
                </Content>
            </Layout>
        </Layout>
    )
}