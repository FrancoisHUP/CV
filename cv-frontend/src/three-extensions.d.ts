declare module "three/examples/jsm/controls/FlyControls" {
    import { Camera, EventDispatcher } from "three";
  
    export class FlyControls extends EventDispatcher {
      object: Camera;
      domElement: HTMLElement;
      movementSpeed: number;
      rollSpeed: number;
      dragToLook: boolean;
      autoForward: boolean;
      constructor(object: Camera, domElement?: HTMLElement);
      update(delta: number): void;
    }
  }
  