import React, {useEffect, useState} from 'react';
import {
    Alert,
    Button,
    Col,
    Collapse, Descriptions,
    Divider,
    Form,
    Input,
    InputNumber, List,
    Modal,
    Row, Space, Spin,
    Switch,
    Table,
    Tabs,
    TabsProps,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import {Icon} from '@ant-design/compatible';
import 'ace-builds/src-noconflict/ace';
import {useNavigate} from 'react-router';
import {useParams} from "react-router-dom";
import axios from 'axios';
import GaugeChart from "react-gauge-chart";
import "ace-builds/src-noconflict/mode-jsx";
import {CodeBlock} from "react-code-blocks";
import ReactAce from "react-ace";

const {Title, Text} = Typography;


const green = "#D1FFBD"
const greenSelected = "#BDFEAE"

const red = "#FF8484"
const redSelected = "#FF7276"

const NodeDetails = () => {
    const history = useNavigate();
    let {nodeName} = useParams();

    const [node, setNode] = useState({
        name: String,
        pods: [],
        available: {
            cpu: 0,
            memory: 0,
            pod_count: 0
        },
        requested: {
            cpu: 0,
            memory: 0,
            pod_count: 0
        }
    });

    const [resources, setResources] = useState({
        cpu: 0,
        memory: 0,
        pod_count: 0
    });

    const [activeCollapses, setActiveCollapses] = useState(new Map());
    const updateActiveCollapses = (k: any, v: any) => {
        setActiveCollapses(new Map(activeCollapses.set(k,v)));
    }

    const [error, setError] = useState({
        message: "",
        description: "",
    });

    const fetchNodeData = () => {
        axios.get(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/nodes/` + nodeName).then(res => {
            setNode(res.data)
            setResources({
                cpu: res.data.requested.cpu / res.data.available.cpu,
                memory: (res.data.requested.memory / 100000000) / (res.data.available.memory / 100000000),
                pod_count: res.data.requested.pod_count / res.data.available.pod_count,
            })
        }).catch(error => {
            if (error.response === undefined) {
                setError({
                    message: String(error),
                    description: "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST
                })
            } else {
                setError(error.response.data);
            }
        })
    };

    useEffect(() => {
        fetchNodeData();

        // setInterval to refresh data every 15 seconds
        const intervalId = setInterval(() => {
            fetchNodeData();
        }, 15000);

        // Cleanup the interval when the component is unmounted
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div>
            {
                error.message.length !== 0 && <Alert
                    message={error.message}
                    description={error.description}
                    type="error"
                    closable
                    afterClose={() => {setError({
                        message: "",
                        description: "",
                    })}}
                    style={{marginBottom: '20px'}}
                />
            }
            <Row>
                <Title>
                    {nodeName}
                </Title>
            </Row>
            <Row>
                <Col span={8}>
                    <GaugeChart id="cpu"
                        animate={false}
                        needleColor={"#949494"}
                        needleBaseColor={"#949494"}
                        textColor={"#000"}
                        nrOfLevels={20}
                        percent={resources.cpu}
                    />
                    <div style={{ textAlign: 'center' }}>
                        <h1>CPU</h1>
                    </div>
                </Col>
                <Col span={8}>
                    <GaugeChart id="memory"
                        animate={false}
                        needleColor={"#949494"}
                        needleBaseColor={"#949494"}
                        textColor={"#000"}
                        nrOfLevels={20}
                        percent={resources.memory}
                    />
                    <div style={{ textAlign: 'center' }}>
                        <h1>Memory</h1>
                    </div>
                </Col>
                <Col span={8}>
                    <GaugeChart id="pods"
                        animate={false}
                        needleColor={"#949494"}
                        needleBaseColor={"#949494"}
                        textColor={"#000"}
                        nrOfLevels={20}
                        percent={resources.pod_count}
                    />
                    <div style={{ textAlign: 'center' }}>
                        <h1>Pod count</h1>
                    </div>
                </Col>
            </Row>
            <Divider/>
        </div>
    );
}

export default NodeDetails;
