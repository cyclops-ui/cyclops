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
import {Pie} from "@ant-design/charts";
import {release} from "os";
import {
    CheckCircleTwoTone,
    CloseSquareTwoTone, InfoCircleOutlined,
    LinkOutlined,
    MinusCircleOutlined,
    PlusOutlined,
    WarningTwoTone,
    DownloadOutlined
} from "@ant-design/icons";
import Link from "antd/lib/typography/Link";
import { formatDistanceToNow } from 'date-fns';

import "ace-builds/src-noconflict/mode-jsx";
import {CodeBlock} from "react-code-blocks";
import ReactAce from "react-ace";

const {Title, Text} = Typography;

interface module {
    name: String,
    namespace: String,
    template: {
        name: String,
        version: String,
        git: {
            repo: String,
            path: String,
            commit: String,
        }
    }
}

const green = "#D1FFBD"
const greenSelected = "#BDFEAE"

const red = "#FF8484"
const redSelected = "#FF7276"



function formatPodAge(podAge: string): string {
    const parsedDate = new Date(podAge);
    return formatDistanceToNow(parsedDate, { addSuffix: true });
}

const NodeDetails = () => {
    const history = useNavigate();
    const [manifestModal, setManifestModal] = useState({
        on: false,
        kind: "",
        name: "",
        namespace: "",
    })
    const [logsModal, setLogsModal] = useState({
        on: false,
        namespace: '',
        pod: '',
        containers: [],
        initContainers: []
    })
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadModule, setLoadModule] = useState(false);
    const [loadResources, setLoadResources] = useState(false);
    const [deleteName, setDeleteName] = useState("");
    const [resources, setResources] = useState([]);
    const [node, setNode] = useState({
        metadata: {
            name: String,
        }
    });

    const [activeCollapses, setActiveCollapses] = useState(new Map());
    const updateActiveCollapses = (k: any, v: any) => {
        setActiveCollapses(new Map(activeCollapses.set(k,v)));
    }

    const [error, setError] = useState({
        message: "",
        description: "",
    });

    let {nodeName} = useParams();
    useEffect(() => {
        axios.get(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/nodes/` + nodeName).then(res => {
            setNode(res.data);
            setLoadModule(true);
        }).catch(error => {
            console.log(error)
            console.log(error.response)
            setLoading(false);
            setLoadModule(true);
            if (error.response === undefined) {
                setError({
                    message: String(error),
                    description: "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST
                })
            } else {
                setError(error.response.data);
            }
        })
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
                    {node.metadata.name}
                </Title>
            </Row>
            <Divider/>
        </div>
    );
}

export default NodeDetails;
