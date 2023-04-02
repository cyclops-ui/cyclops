import React, {useState} from "react";
import {Button, Typography} from "antd";
import axios from "axios";

const { Text } = Typography;

const AuthButton = () => {
    const [created, setCreated] = useState(false)
    const [command, setCommand] = useState("")

    if (created) {
        return <div>
            <Text code>{command}</Text>
            <Button onClick={function () {
                axios.delete(process.env.REACT_APP_CYCLOPS_CTRL_HOST + '/deployments/ssh-dev-pod-name',
                    {
                        data: {
                            "name": "ssh-dev-pod-name",
                            "kind":"deployments",
                            "namespace": "default"
                        }
                    })
                    .then(function (response) {
                        console.log(response)
                        window.location.href = "/"
                    })
                    .catch(function(error) {
                        console.log(error)
                        window.location.href = "/"
                    })
                setCreated(false)
            }} danger block>Kill SSHable pod</Button>
        </div>;
    } else {
        return  <Button onClick={function () {
            axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + '/ssh-pod')
                .then(function (response) {
                    setCommand(response.data.command)
                })
                .catch(function(error) {
                    console.log(error)
                })

            setCreated(true);
        }} block>Create new sshable pod</Button>
    }
};

export default AuthButton;
