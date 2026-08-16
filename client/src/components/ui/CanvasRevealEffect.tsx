import React, { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Adapted from a community 21st.dev component. Stripped of Next.js-specific
// bits ("use client", next/link) since this project runs on Vite, and
// defaulted to Aik Kadam's brand blue (#3087F8 → rgb(48,135,248)) instead of
// the original's plain white dots.

interface ShaderProps {
  source: string;
  uniforms: {
    [key: string]: {
      value: number[] | number[][] | number;
      type: string;
    };
  };
  maxFps?: number;
}

export const CanvasRevealEffect = ({
  animationSpeed = 3,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[48, 135, 248]],
  containerClassName,
  dotSize = 3,
  totalSize = 20,
  showGradient = false,
  reverse = false,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  totalSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => {
  return (
    <div className={containerClassName ? `h-full relative w-full ${containerClassName}` : "h-full relative w-full"}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors}
          dotSize={dotSize}
          totalSize={totalSize}
          opacities={opacities}
          shader={`
            ${reverse ? "u_reverse_active" : "false"}_;
            animation_speed_factor_${animationSpeed.toFixed(1)}_;
          `}
          center={["x", "y"]}
        />
      </div>
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
      )}
    </div>
  );
};

interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string;
  center?: ("x" | "y")[];
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[48, 135, 248]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
}) => {
  const uniforms = useMemo(() => {
    let colorsArray = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]];
    if (colors.length === 2) {
      colorsArray = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]];
    } else if (colors.length === 3) {
      colorsArray = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]];
    }
    return {
      u_colors: {
        value: colorsArray.map((color) => [color[0] / 255, color[1] / 255, color[2] / 255]),
        type: "uniform3fv",
      },
      u_opacities: { value: opacities, type: "uniform1fv" },
      u_total_size: { value: totalSize, type: "uniform1f" },
      u_dot_size: { value: dotSize, type: "uniform1f" },
      u_reverse: { value: shader.includes("u_reverse_active") ? 1 : 0, type: "uniform1i" },
    };
  }, [colors, opacities, totalSize, dotSize, shader]);

  return (
    <Shader
      source={`
        precision highp float;
        in vec2 fragCoord;

        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse;

        out vec4 fragColor;

        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }

        void main() {
            vec2 st = fragCoord.xy;
            ${center.includes("x") ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));" : ""}
            ${center.includes("y") ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));" : ""}

            float opacity = step(0.0, st.x);
            opacity *= step(0.0, st.y);

            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

            float frequency = 5.0;
            float show_offset = random(st2);
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
            opacity *= u_opacities[int(rand * 10.0)];

            // Round dot mask: distance from the center of this grid cell,
            // soft-edged circle instead of a hard square block.
            vec2 cell_uv = fract(st / u_total_size) - 0.5;
            float dist_from_cell_center = length(cell_uv) * u_total_size;
            float dot_radius = u_dot_size * 0.5;
            opacity *= 1.0 - smoothstep(dot_radius - 1.0, dot_radius, dist_from_cell_center);

            vec3 color = u_colors[int(show_offset * 6.0)];

            vec2 center_grid = u_resolution / 2.0 / u_total_size;
            float dist_from_center = distance(center_grid, st2);

            // Multiple waves passing through in random directions
            float wave1 = 0.5 + 0.5 * sin(dist_from_center * 0.3 - u_time * 2.0);
            float wave2 = 0.5 + 0.5 * sin(st2.x * 0.2 + st2.y * 0.15 - u_time * 1.5);
            float wave3 = 0.5 + 0.5 * sin(st2.y * 0.25 - u_time * 1.8);
            opacity *= mix(0.3, 1.0, (wave1 + wave2 + wave3) / 3.0);

            // Random disturbance effect
            float disturbance = random(st2 + u_time * 0.5);
            opacity *= 0.7 + 0.3 * disturbance;

            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a;
        }`}
      uniforms={uniforms}
      maxFps={60}
    />
  );
};

type Uniforms = { [key: string]: { value: number[] | number[][] | number; type: string } };

const ShaderMaterial = ({ source, uniforms }: { source: string; uniforms: Uniforms }) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const material: any = ref.current.material;
    material.uniforms.u_time.value = clock.getElapsedTime();
  });

  const getUniforms = () => {
    const prepared: any = {};
    for (const name in uniforms) {
      const uniform: any = uniforms[name];
      switch (uniform.type) {
        case "uniform1f":
          prepared[name] = { value: uniform.value, type: "1f" };
          break;
        case "uniform1i":
          prepared[name] = { value: uniform.value, type: "1i" };
          break;
        case "uniform1fv":
          prepared[name] = { value: uniform.value, type: "1fv" };
          break;
        case "uniform3fv":
          prepared[name] = {
            value: uniform.value.map((v: number[]) => new THREE.Vector3().fromArray(v)),
            type: "3fv",
          };
          break;
        default:
          break;
      }
    }
    prepared["u_time"] = { value: 0, type: "1f" };
    prepared["u_resolution"] = { value: new THREE.Vector2(size.width * 2, size.height * 2) };
    return prepared;
  };

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
      precision highp float;
      in vec2 coordinates;
      uniform vec2 u_resolution;
      out vec2 fragCoord;
      void main(){
        float x = position.x;
        float y = position.y;
        gl_Position = vec4(x, y, 0.0, 1.0);
        fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
        fragCoord.y = u_resolution.y - fragCoord.y;
      }
      `,
      fragmentShader: source,
      uniforms: getUniforms(),
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, source]);

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms }) => {
  return (
    <Canvas
      className="absolute inset-0 h-full w-full"
      gl={{ antialias: true, alpha: true, failIfMajorPerformanceCaveat: false }}
      onCreated={({ gl }) => {
        // Diagnostic: confirms in the browser console whether a real WebGL
        // context was obtained, and if so which renderer backend is behind
        // it (a "SwiftShader"/"llvmpipe" renderer means it's running on a
        // software fallback rather than the GPU — still valid, just slower).
        const info = gl.getContext().getParameter(gl.getContext().RENDERER);
        console.log("[CanvasRevealEffect] WebGL context created. Renderer:", info);
      }}
    >
      <ShaderMaterial source={source} uniforms={uniforms} />
    </Canvas>
  );
};
