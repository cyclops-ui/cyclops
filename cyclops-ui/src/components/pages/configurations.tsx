import React, {useEffect, useState} from 'react';
import {Button, Col, Divider, Row, Select, Table, Tag, Typography, Input, Space} from 'antd';
import {Icon} from '@ant-design/compatible';
import {useNavigate} from 'react-router';
import axios from 'axios';
import SearchInput from "../searchbar";
import { SearchOutlined } from '@ant-design/icons';

const {Title} = Typography;

const Configurations = () => {
    const history = useNavigate();
    const [allData, setAllData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [namespacesState, setNamespacesState] = useState([]);
    useEffect(() => {
        setLoading(true);
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/configuration-details`).then(res => {
            setAllData(res.data);
        });
        setLoading(false);
    }, []);

    const handleClick = () => {
        window.location.href = "/create-form"
    }

    return (
        <div>
            <Row gutter={[40, 0]}>
                <Col span={18}>
                    <Title level={2}>
                        Available configurations
                    </Title>
                </Col>
                <Col span={6}>
                    <Button onClick={handleClick} block>Add application template</Button>
                </Col>
            </Row>
            <Divider orientationMargin="0"/>
            <Col span={24} style={{overflowX: "auto"}}>
                <Table loading={loading} dataSource={allData}>
                    <Table.Column
                        title='Configurations name'
                        dataIndex='name'
                        key='name'
                    />
                    <Table.Column
                        title='Created'
                        dataIndex='created'
                        key='created'
                    />
                    <Table.Column
                        title='Edited'
                        dataIndex='edited'
                        key='edited'
                    />
                    <Table.Column
                        title='Details'
                        width='15%'
                        render={config =>
                            <Button onClick={function () {
                                window.location.href = "/configurations/" + config.name
                            }} block>Details</Button>
                        }
                    />
                </Table>
            </Col>
        </div>
    );
}

export default Configurations;
