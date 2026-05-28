import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const MathGridBackground = ({ triggerPulse }) => {
    const containerRef = useRef();
    const sceneRef = useRef();
    const pulseRef = useRef(0);

    useEffect(() => {
        if (!containerRef.current) return;

        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.fog = new THREE.FogExp2(0x050505, 0.05);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        camera.position.y = 2;
        camera.rotation.x = -0.5;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);

        // Infinite Grid
        const gridHelper = new THREE.GridHelper(100, 100, 0x00f3ff, 0x222222);
        scene.add(gridHelper);

        const animate = () => {
            requestAnimationFrame(animate);

            // Move grid
            gridHelper.position.z = (Date.now() * 0.002) % 1;

            // Pulse effect
            if (pulseRef.current > 0) {
                const intensity = pulseRef.current;
                gridHelper.material.color.setHSL(0.5 + intensity * 0.2, 1, 0.5 + intensity * 0.5);
                scene.fog.color.setHSL(0.5 + intensity * 0.2, 0.5, 0.02 + intensity * 0.05);
                pulseRef.current -= 0.02;
            } else {
                gridHelper.material.color.setHex(0x00f3ff); // reset
                scene.fog.color.setHex(0x050505);
            }

            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    useEffect(() => {
        if (triggerPulse) {
            pulseRef.current = 1.0;
        }
    }, [triggerPulse]);

    return (
        <div
            ref={containerRef}
            className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none mix-blend-screen opacity-50"
        />
    );
};

export default MathGridBackground;
