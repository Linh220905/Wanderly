import type { ReactElement } from 'react';

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

type MapState = {
  distance: number;
  explored: number;
  coins: number;
};

export declare function LiveMap(props: {
  state: MapState;
  route?: MapCoordinate[];
  current?: MapCoordinate;
  active: boolean;
  seconds: number;
  start: () => void;
  pause: () => void;
  finish: () => void;
}): ReactElement | null;
