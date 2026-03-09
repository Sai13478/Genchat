import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="loaders-container">
        <div className="loader">
          <svg viewBox="0 0 80 80">
            <rect x={8} y={8} width={64} height={64} />
            <text x="50%" y="60%" textAnchor="middle" fill="currentColor" fontSize={28} fontWeight="900">
              G
            </text>
          </svg>
        </div>
        <div className="loader">
          <svg viewBox="0 0 80 80">
            <rect x={8} y={8} width={64} height={64} />
            <text x="50%" y="60%" textAnchor="middle" fill="currentColor" fontSize={28} fontWeight="900">
              E
            </text>
          </svg>
        </div>
        <div className="loader">
          <svg viewBox="0 0 80 80">
            <rect x={8} y={8} width={64} height={64} />
            <text x="50%" y="60%" textAnchor="middle" fill="currentColor" fontSize={28} fontWeight="900">
              N
            </text>
          </svg>
        </div>
        <div className="loader">
          <svg viewBox="0 0 80 80">
            <rect x={8} y={8} width={64} height={64} />
            <text x="50%" y="60%" textAnchor="middle" fill="currentColor" fontSize={28} fontWeight="900">
              C
            </text>
          </svg>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  .loaders-container {
      display: flex;
      gap: 12px;
  }

  .loader {
    --path: rgba(255, 255, 255, 0.1);
    --dot: #3b82f6;
    --duration: 3s;
    width: 56px;
    height: 56px;
    position: relative;
    color: white;
    transition: all 0.3s ease;
  }

  .loader:before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    position: absolute;
    display: block;
    background: var(--dot);
    top: 48px;
    left: 25px;
    transform: translate(-23px, -23px);
    animation: dotRect var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
    box-shadow: 0 0 10px var(--dot);
  }

  .loader svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .loader svg rect {
    fill: rgba(255, 255, 255, 0.03);
    stroke: var(--path);
    stroke-width: 4px;
    stroke-linejoin: round;
    stroke-linecap: round;
    stroke-dasharray: 192 64 192 64;
    stroke-dashoffset: 0;
    animation: pathRect 3s cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
  }

  .loader text {
      /* filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3)); */
  }

  @keyframes pathRect {
    25% { stroke-dashoffset: 64; }
    50% { stroke-dashoffset: 128; }
    75% { stroke-dashoffset: 192; }
    100% { stroke-dashoffset: 256; }
  }

  @keyframes dotRect {
    25% { transform: translate(0, 0); }
    50% { transform: translate(23px, -23px); }
    75% { transform: translate(0, -46px); }
    100% { transform: translate(-23px, -23px); }
  }

  .loader {
    display: inline-block;
  }
`;

export default Loader;
