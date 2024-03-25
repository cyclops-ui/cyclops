import React, {useEffect, useState} from 'react'
import { LineChart } from '@mui/x-charts/LineChart';

const ProductivityGraph = () => {
    const initialData = [0, 0, 0, 0, 0, 0, 0];

    // State to hold chart data
    const [data, setData] = useState(initialData);

    // Function to update chart data for animation
    const updateChartData = () => {
        const newData = [65, 59, 80, 81, 56, 55, 44,];
        setData(newData);
    };

    // Use useEffect to trigger animation
    useEffect(() => {
        const animation = () => {
            const frame = () => {
                updateChartData();
            };
            const interval = setInterval(frame, 1000); // Update every second
            return () => clearInterval(interval);
        };
        animation();
    }, []);

    return (
        <div/>
    )
}

export default ProductivityGraph;
