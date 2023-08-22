import React from 'react';
import styles from './styles.module.css';
import CodeBlock from '@theme/CodeBlock'
import {Form, Input, InputNumber, Switch} from "antd";

class Comparison extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            name: "nginx",
            replicas: "3",
            version: "1.14.2",
            port: "80",
            service: false,
        };
    }

    render() {
        const k8sDplString = 'apiVersion: apps/v1\n' +
            'kind: Deployment\n' +
            'metadata:\n' +
            '  name: ' + this.state.name + '\n' +
            '  labels:\n' +
            '    app: ' + this.state.name + '\n' +
            'spec:\n' +
            '  replicas: ' + this.state.replicas + '\n' +
            '  selector:\n' +
            '    matchLabels:\n' +
            '      app: ' + this.state.name + '\n' +
            '  template:\n' +
            '    metadata:\n' +
            '      labels:\n' +
            '        app: ' + this.state.name + '\n' +
            '    spec:\n' +
            '      containers:\n' +
            '      - name: ' + this.state.name + '\n' +
            '        image: ' + this.state.name + ':' + this.state.version + '\n' +
            '        ports:\n' +
            '        - containerPort: ' + this.state.port

        const k8sSvcString = '---\n' +
            'apiVersion: v1\n' +
            'kind: Service\n' +
            'metadata:\n' +
            '  name: ' + this.state.name + '\n' +
            'spec:\n' +
            '  selector:\n' +
            '    app: ' + this.state.name + '\n' +
            '  ports:\n' +
            '    - protocol: TCP\n' +
            '      port: ' + this.state.port + '\n' +
            '      targetPort: 9376'

        const onNameChange = (event) => {
            this.setState({
                name: event.target.value,
                replicas: this.state.replicas,
                version: this.state.version,
                port: this.state.port,
                service: this.state.service,
            })
        }

        const onReplicasChange = (replicas) => {
            this.setState({
                name: this.state.name,
                replicas: replicas,
                version: this.state.version,
                port: this.state.port,
                service: this.state.service,
            })
        }

        const onVersionChange = (event) => {
            this.setState({
                name: this.state.name,
                replicas: this.state.replicas,
                version: event.target.value,
                port: this.state.port,
                service: this.state.service,
            })
        }

        const onPortChange = (port) => {
            this.setState({
                name: this.state.name,
                replicas: this.state.replicas,
                version: this.state.version,
                port: port,
                service: this.state.service,
            })
        }

        const onNeedService = (service) => {
            this.setState({
                name: this.state.name,
                replicas: this.state.replicas,
                version: this.state.version,
                port: this.state.port,
                service: service,
            })
        }

        const getManifest = () => {
            var manifest = k8sDplString;

            if (this.state.service) {
                manifest += '\n' + k8sSvcString;
            }

            return manifest
        }

        return (
            <div className={styles.all}>
                <div className={styles.ui}>
                    <h1 className="hero__title uiText">Deploying made easy</h1>
                    <p className="hero__subtitle">Cyclops gives you a UI containing fields you define yourself to manage your
                        K8s workloads.</p>
                    <p className="hero__subtitle">Give it a go!</p>
                    <Form labelCol={{span: '6'}}>
                        <Form.Item
                            label="Name"
                            style={{ flexDirection: 'row' }}
                        >
                            <Input defaultValue={'nginx'} onChange={onNameChange}/>
                        </Form.Item>
                        <Form.Item
                            label="Replicas"
                            style={{display: 'block'}}
                        >
                            <InputNumber style={{width: '100%'}} defaultValue={'3'} onChange={onReplicasChange}/>
                        </Form.Item>
                        <Form.Item
                            label="Version"
                            style={{display: 'block'}}
                        >
                            <Input defaultValue={'1.14.2'} onChange={onVersionChange}/>
                        </Form.Item>
                        <Form.Item
                            label="Port"
                            style={{display: 'block'}}
                        >
                            <InputNumber style={{width: '100%'}} defaultValue={'80'} onChange={onPortChange}/>
                        </Form.Item>
                        <Form.Item
                            label="Need service"
                            style={{display: 'block', textAlign: 'left'}}
                        >
                            <Switch defaultValue={'false'} onChange={onNeedService}/>
                        </Form.Item>
                    </Form>
                </div>
                <div className={styles.yaml}>
                    <CodeBlock
                        language={'yaml'}
                        showLineNumbers={true}
                    >
                        {getManifest()}
                    </CodeBlock>
                </div>
            </div>
        );
    }
}

export default Comparison;
