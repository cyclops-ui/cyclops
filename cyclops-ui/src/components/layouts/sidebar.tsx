import React from 'react';
import { Menu } from 'antd';
import {
    UserOutlined,
    SettingOutlined,
    AppstoreAddOutlined,
} from '@ant-design/icons';
import {useNavigate}  from 'react-router';
const SideNav = () => {
    const history = useNavigate();
    const handleUserClick = () => {
        history('/');
    }
    const handleVideosClick = () => {
        history('/videos');
    }
    const handleFileClick = () => {
        history('/configurations');
    }
    const handleModulesClick = () => {
        history('/modules');
    }
    const handlePodsClick = () => {
        history('/pods');
    }
    return (
        <div>
            <div style={{top: "0", height: "32px", width: "100%", margin: "1rem", display: "inline-flex", alignContent: "center"}}>
                <h2 style={{verticalAlign: "center", color: "white", textAlign: "center", textSizeAdjust: "120%"}}><b>Cyclops</b></h2>{'       '}
                <img  style={{height: "120%", objectFit: "contain", marginLeft: "6px"}}
                     src={require("./KIKLOPcic.png")} alt="Cyclops" />;
            </div>
            <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
                <Menu.Item key="2" onClick={handleModulesClick}>
                    <AppstoreAddOutlined />
                    <span> Modules</span>
                </Menu.Item>
            </Menu>
        </div>
    );
}
export default SideNav;