Jessica's 2025 Christmas Tree
<img width="2718" height="1547" alt="6039ce19c2e3d5150fa21267f13abc8e" src="https://github.com/user-attachments/assets/3996076b-8c93-4da0-aeb9-2b068eb2ba57" />
大家如果想做自己的话可以fork仓库修改
也可以用ai从零开始，提示词为
1. 角色设定 请作为一名资深的前端图形工程师，使用 React 19、TypeScript、Three.js (@react-three/fiber) 以及 TailwindCSS 开发一个高互动性的 3D 网页应用。
2. 核心视觉风格 (Visual Style) 整体氛围：营造“粉色梦幻与科技感结合”的圣诞氛围。背景色为深邃的黑粉色 (#050103)，配合强烈的辉光 (Bloom) 和边缘光 (Rim Light)。几何堆叠 (Instanced Geometry)：不要使用简单的粒子点，而是使用大量的 3D 实体几何体通过 InstancedMesh 实例化渲染以保证性能（总数 7000+）。 树叶：大量蓝紫色系 (#8170fc,#c0b2e9) 的八面体 (Octahedrons)，材质为半哑光金属。 装饰：高反光的白色/淡紫色立方体 (Cubes) 和二十面体 (Icosahedrons)，材质像宝石或镜面。 螺旋丝带：一条由白色微小四面体 (Tetrahedrons) 组成的螺旋线，环绕树身向上盘旋（约 3 圈），线条要极简优雅。树顶星：一个精致、纤薄的自定义形状五角星，带有强烈的发光光晕。
3. 交互逻辑 (Interaction Logic) 动画状态：应用有两种核心状态——TREE（聚拢成树）和 EXPLODE（向四周炸开/混沌分布）。 鼠标交互：点击屏幕任意位置，在这两种状态间切换。 过渡效果：位置变换需要使用线性插值 (Lerp) 实现平滑过渡，树在任何状态下都应保持缓慢自转。
4. 高级手势控制 (AI Gesture Control) 集成 MediaPipe (Hand Landmarker) 实现摄像头手势识别。 UI 反馈：在右下角显示摄像头预览（镜像翻转），并提供一个跟随手指的自定义光标。 手势逻辑： 握拳/捏合 (Pinch/Grab)：触发 TREE 状态，粒子聚拢成圣诞树。 张开手掌 (Open Hand)：触发 EXPLODE 状态，粒子被打散。 手掌移动：当手掌张开并左右移动时，控制场景中粒子群的旋转角度（高灵敏度，模拟拖拽感）。
