import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Sky, Cloud } from '@react-three/drei';
import * as THREE from 'three';

// Generate random crab name
const crabNames = ['Pinchy', 'Snippy', 'Clawdia', 'Sheldon', 'Sandy', 'Coral', 'Bubbles', 'Neptune', 'Tide', 'Kelp', 'Marina', 'Barnacle', 'Reef', 'Scuttle', 'Waddle'];
const adjectives = ['Grumpy', 'Happy', 'Sleepy', 'Speedy', 'Lazy', 'Curious', 'Shy', 'Bold', 'Tiny', 'Big'];

function generateCrabName() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const name = crabNames[Math.floor(Math.random() * crabNames.length)];
  return `${adj} ${name}`;
}

function generateUserHandle() {
  const words = ['Crab', 'Shell', 'Wave', 'Sand', 'Tide', 'Reef', 'Coral', 'Pearl', 'Ocean', 'Beach'];
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 999);
  return `${word1}${word2}${num}`;
}

// Crab component with autonomous movement
function Crab({ position, name, speed, color }: { position: [number, number, number]; name: string; speed: number; color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRef = useRef({ x: position[0], z: position[2] });
  const currentPos = useRef({ x: position[0], z: position[2] });
  const legPhase = useRef(0);
  const clawPhase = useRef(0);
  const waitTimer = useRef(0);
  const isWaiting = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    legPhase.current += delta * speed * 15;
    clawPhase.current += delta * 2;

    // Autonomous movement
    if (isWaiting.current) {
      waitTimer.current -= delta;
      if (waitTimer.current <= 0) {
        isWaiting.current = false;
        // Pick new target
        targetRef.current = {
          x: (Math.random() - 0.5) * 18,
          z: (Math.random() - 0.5) * 18
        };
      }
    } else {
      const dx = targetRef.current.x - currentPos.current.x;
      const dz = targetRef.current.z - currentPos.current.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.5) {
        isWaiting.current = true;
        waitTimer.current = Math.random() * 3 + 1;
      } else {
        const moveSpeed = speed * delta;
        currentPos.current.x += (dx / dist) * moveSpeed;
        currentPos.current.z += (dz / dist) * moveSpeed;

        // Rotate to face direction (crabs walk sideways!)
        const angle = Math.atan2(dx, dz) + Math.PI / 2;
        groupRef.current.rotation.y = angle;
      }
    }

    groupRef.current.position.x = currentPos.current.x;
    groupRef.current.position.z = currentPos.current.z;
  });

  const legAnimation = Math.sin(legPhase.current) * 0.2;
  const clawAnimation = Math.sin(clawPhase.current) * 0.1 + 0.3;

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.1, 0.45, 0.15]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.15]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.1, 0.45, 0.15]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.15]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.1, 0.55, 0.15]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.1, 0.55, 0.15]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Claws */}
      <group position={[-0.35, 0.15, 0.2]} rotation={[0, 0, clawAnimation]}>
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.08, 0.15]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[-0.12, 0.05, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.1, 0.04, 0.1]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[-0.12, -0.03, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.1, 0.04, 0.1]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      <group position={[0.35, 0.15, 0.2]} rotation={[0, 0, -clawAnimation]}>
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.08, 0.15]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0.12, 0.05, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.1, 0.04, 0.1]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0.12, -0.03, 0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.1, 0.04, 0.1]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>

      {/* Legs */}
      {[-1, 1].map((side) =>
        [0, 1, 2].map((i) => (
          <mesh
            key={`leg-${side}-${i}`}
            position={[side * 0.25, 0.05, -0.1 + i * 0.1]}
            rotation={[0, 0, side * (0.8 + (i % 2 === 0 ? legAnimation : -legAnimation))]}
            castShadow
          >
            <cylinderGeometry args={[0.02, 0.015, 0.2]} />
            <meshStandardMaterial color={color} />
          </mesh>
        ))
      )}

      {/* Name tag */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.12}
        color="#2d3436"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshRTM9jo7eTWk.woff2"
      >
        {name}
      </Text>
    </group>
  );
}

// Chat bubble that floats and fades
function ChatBubble({ message, position, createdAt, userName }: { message: string; position: [number, number, number]; createdAt: number; userName: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const age = (Date.now() - createdAt) / 1000;
  const opacity = Math.max(0, 1 - age / 15);
  const floatOffset = Math.sin(Date.now() / 1000 + createdAt) * 0.1;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + floatOffset + age * 0.05;
    }
  });

  if (opacity <= 0) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Bubble background */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[Math.min(message.length * 0.12 + 0.5, 4), 0.6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={opacity * 0.95} />
      </mesh>
      {/* Bubble pointer */}
      <mesh position={[0, -0.35, -0.01]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.15, 0.15]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={opacity * 0.95} />
      </mesh>
      {/* User name */}
      <Text
        position={[0, 0.12, 0]}
        fontSize={0.08}
        color="#e17055"
        anchorX="center"
        anchorY="middle"
        maxWidth={3.5}
        font="https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshRTM9jo7eTWk.woff2"
      >
        {userName}
      </Text>
      {/* Message text */}
      <Text
        position={[0, -0.08, 0]}
        fontSize={0.12}
        color="#2d3436"
        anchorX="center"
        anchorY="middle"
        maxWidth={3.5}
        font="https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshRTM9jo7eTWk.woff2"
      >
        {message}
      </Text>
    </group>
  );
}

// Town buildings
function Building({ position, height, width, color }: { position: [number, number, number]; height: number; width: number; color: string }) {
  return (
    <group position={position}>
      {/* Main building */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, height + 0.2, 0]} castShadow>
        <coneGeometry args={[width * 0.8, 0.5, 4]} />
        <meshStandardMaterial color="#c0392b" roughness={0.7} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.25, width / 2 + 0.01]}>
        <planeGeometry args={[0.3, 0.5]} />
        <meshStandardMaterial color="#5d4e37" />
      </mesh>
      {/* Windows */}
      {height > 1 && (
        <>
          <mesh position={[-width / 4, height / 2, width / 2 + 0.01]}>
            <planeGeometry args={[0.2, 0.2]} />
            <meshStandardMaterial color="#74b9ff" emissive="#74b9ff" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[width / 4, height / 2, width / 2 + 0.01]}>
            <planeGeometry args={[0.2, 0.2]} />
            <meshStandardMaterial color="#74b9ff" emissive="#74b9ff" emissiveIntensity={0.3} />
          </mesh>
        </>
      )}
    </group>
  );
}

// Palm tree
function PalmTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 2, 8]} />
        <meshStandardMaterial color="#8b7355" roughness={0.9} />
      </mesh>
      {/* Leaves */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={i}
          position={[Math.cos((i * Math.PI) / 3) * 0.5, 2.2, Math.sin((i * Math.PI) / 3) * 0.5]}
          rotation={[Math.PI / 4, (i * Math.PI) / 3, 0]}
          castShadow
        >
          <coneGeometry args={[0.1, 1.2, 4]} />
          <meshStandardMaterial color="#27ae60" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// Rock formations
function Rock({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <dodecahedronGeometry args={[scale, 0]} />
      <meshStandardMaterial color="#7f8c8d" roughness={0.9} />
    </mesh>
  );
}

// Seashell decorations
function Shell({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <mesh position={position} rotation={[0, rotation, Math.PI / 6]}>
      <torusGeometry args={[0.08, 0.03, 8, 12, Math.PI * 1.5]} />
      <meshStandardMaterial color="#ffeaa7" roughness={0.5} />
    </mesh>
  );
}

// Water plane with animation
function Water() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const positions = meshRef.current.geometry.attributes.position;
      const time = clock.getElapsedTime();

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const y = Math.sin(x * 0.5 + time) * 0.1 + Math.sin(z * 0.3 + time * 0.8) * 0.1;
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[15, -0.1, 0]} receiveShadow>
      <planeGeometry args={[15, 40, 32, 32]} />
      <meshStandardMaterial
        color="#0984e3"
        transparent
        opacity={0.8}
        roughness={0.1}
        metalness={0.3}
      />
    </mesh>
  );
}

// Main scene component
function Scene({ messages, userHandle }: { messages: Array<{ id: string; text: string; userName: string; createdAt: number; position: [number, number, number] }>; userHandle: string }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(8, 10, 15);
  }, [camera]);

  // Generate crabs
  const crabs = useMemo(() => {
    const colors = ['#e17055', '#d63031', '#e84393', '#fd79a8', '#fab1a0', '#ff7675'];
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      name: generateCrabName(),
      position: [(Math.random() - 0.5) * 16, 0, (Math.random() - 0.5) * 16] as [number, number, number],
      speed: 0.5 + Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
  }, []);

  // Town layout
  const buildings = useMemo(() => [
    { position: [-6, 0, -6] as [number, number, number], height: 1.5, width: 1.2, color: '#dfe6e9' },
    { position: [-3, 0, -7] as [number, number, number], height: 2, width: 1.5, color: '#ffeaa7' },
    { position: [0, 0, -8] as [number, number, number], height: 1.8, width: 1.3, color: '#fab1a0' },
    { position: [4, 0, -6] as [number, number, number], height: 2.2, width: 1.4, color: '#81ecec' },
    { position: [-7, 0, -2] as [number, number, number], height: 1.3, width: 1, color: '#a29bfe' },
    { position: [-8, 0, 3] as [number, number, number], height: 1.6, width: 1.2, color: '#fd79a8' },
    { position: [5, 0, -2] as [number, number, number], height: 1.4, width: 1.1, color: '#55efc4' },
  ], []);

  const palmTrees = useMemo(() => [
    [-5, 0, 2] as [number, number, number],
    [3, 0, 4] as [number, number, number],
    [-2, 0, 6] as [number, number, number],
    [6, 0, 1] as [number, number, number],
    [-7, 0, -5] as [number, number, number],
  ], []);

  const rocks = useMemo(() => [
    { position: [4, 0.15, 7] as [number, number, number], scale: 0.3 },
    { position: [-6, 0.2, 5] as [number, number, number], scale: 0.4 },
    { position: [2, 0.1, -4] as [number, number, number], scale: 0.2 },
    { position: [-4, 0.15, -3] as [number, number, number], scale: 0.25 },
  ], []);

  const shells = useMemo(() =>
    Array.from({ length: 15 }, () => ({
      position: [(Math.random() - 0.5) * 18, 0.02, (Math.random() - 0.5) * 18] as [number, number, number],
      rotation: Math.random() * Math.PI * 2
    })), []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-5, 3, 5]} intensity={0.3} color="#ffeaa7" />

      {/* Sky */}
      <Sky sunPosition={[100, 20, 100]} turbidity={0.3} rayleigh={0.5} />

      {/* Clouds */}
      <Cloud position={[-10, 12, -10]} speed={0.2} opacity={0.5} />
      <Cloud position={[10, 14, -5]} speed={0.3} opacity={0.4} />
      <Cloud position={[0, 13, 10]} speed={0.25} opacity={0.45} />

      {/* Ground - sandy beach */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[25, 40]} />
        <meshStandardMaterial color="#f5d6ba" roughness={1} />
      </mesh>

      {/* Path / town square area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]} receiveShadow>
        <circleGeometry args={[5, 32]} />
        <meshStandardMaterial color="#ddd0c2" roughness={0.9} />
      </mesh>

      {/* Water */}
      <Water />

      {/* Buildings */}
      {buildings.map((b, i) => (
        <Building key={i} {...b} />
      ))}

      {/* Palm trees */}
      {palmTrees.map((pos, i) => (
        <PalmTree key={i} position={pos} />
      ))}

      {/* Rocks */}
      {rocks.map((r, i) => (
        <Rock key={i} {...r} />
      ))}

      {/* Shells */}
      {shells.map((s, i) => (
        <Shell key={i} {...s} />
      ))}

      {/* Crabs */}
      {crabs.map((crab) => (
        <Crab key={crab.id} {...crab} />
      ))}

      {/* Chat bubbles */}
      {messages.map((msg) => (
        <ChatBubble
          key={msg.id}
          message={msg.text}
          position={msg.position}
          createdAt={msg.createdAt}
          userName={msg.userName}
        />
      ))}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
      />
    </>
  );
}

interface Message {
  id: string;
  text: string;
  userName: string;
  createdAt: number;
  position: [number, number, number];
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [userHandle] = useState(() => generateUserHandle());
  const [showWelcome, setShowWelcome] = useState(true);

  // Clean up old messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(prev => prev.filter(m => Date.now() - m.createdAt < 15000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      text: inputValue.trim().slice(0, 100),
      userName: userHandle,
      createdAt: Date.now(),
      position: [
        (Math.random() - 0.5) * 12,
        3 + Math.random() * 2,
        (Math.random() - 0.5) * 12
      ]
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
  }, [inputValue, userHandle]);

  return (
    <div className="w-full h-dvh bg-gradient-to-b from-sky-300 via-sky-200 to-amber-100 relative overflow-hidden font-body">
      {/* Canvas container */}
      <div className="absolute inset-0">
        <Canvas shadows camera={{ fov: 50 }}>
          <Scene messages={messages} userHandle={userHandle} />
        </Canvas>
      </div>

      {/* Welcome modal */}
      {showWelcome && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border-4 border-amber-200">
            <h1 className="font-display text-3xl md:text-4xl text-orange-800 mb-3 text-center">
              Welcome to Crab Town
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-pink-400 mx-auto mb-4 rounded-full" />
            <p className="text-amber-900/80 text-center mb-4 text-sm md:text-base">
              A tiny beach town where crabs roam free. Watch them scuttle about their daily lives!
            </p>
            <div className="bg-white/60 rounded-xl p-4 mb-6">
              <p className="text-center text-amber-800 text-sm mb-1">Your handle:</p>
              <p className="text-center font-display text-xl md:text-2xl text-orange-600">{userHandle}</p>
            </div>
            <p className="text-amber-700/70 text-center text-xs mb-6">
              Drag to rotate view, scroll to zoom, and send messages that float above the town!
            </p>
            <button
              onClick={() => setShowWelcome(false)}
              className="w-full py-4 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-display text-lg md:text-xl rounded-2xl shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Enter the Town
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 pointer-events-none">
        <div className="flex items-center justify-between">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl px-4 py-2 md:px-6 md:py-3 shadow-lg border border-amber-200">
            <h1 className="font-display text-xl md:text-2xl lg:text-3xl text-orange-700">
              Crab Town
            </h1>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl px-3 py-2 md:px-4 shadow-lg border border-amber-200">
            <p className="text-amber-600 text-xs md:text-sm">Playing as</p>
            <p className="font-display text-orange-600 text-sm md:text-base">{userHandle}</p>
          </div>
        </div>
      </div>

      {/* Message count indicator */}
      {messages.length > 0 && (
        <div className="absolute top-20 md:top-24 left-3 md:left-4 bg-white/70 backdrop-blur-sm rounded-full px-3 py-1.5 md:px-4 md:py-2 shadow-md border border-amber-200">
          <p className="text-amber-700 text-xs md:text-sm">
            {messages.length} message{messages.length !== 1 ? 's' : ''} floating
          </p>
        </div>
      )}

      {/* Chat input */}
      <div className="absolute bottom-12 md:bottom-16 left-0 right-0 p-3 md:p-4 pointer-events-none">
        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto pointer-events-auto"
        >
          <div className="flex gap-2 md:gap-3 bg-white/90 backdrop-blur-md rounded-2xl p-2 md:p-3 shadow-xl border-2 border-amber-200">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Share a message with the town..."
              maxLength={100}
              className="flex-1 bg-amber-50/50 rounded-xl px-3 py-3 md:px-4 md:py-3 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm md:text-base min-w-0"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 disabled:from-gray-300 disabled:to-gray-300 text-white font-display px-4 py-3 md:px-6 rounded-xl shadow-md transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:transform-none text-sm md:text-base whitespace-nowrap"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 text-center py-2 md:py-3 pointer-events-none">
        <p className="text-amber-700/50 text-[10px] md:text-xs">
          Requested by @OxPaulius · Built by @clonkbot
        </p>
      </footer>
    </div>
  );
}

export default App;
