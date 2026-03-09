import React from 'react';
import styled from 'styled-components';

const InnovationLoader = () => {
    return (
        <StyledWrapper className="flex items-center justify-center w-full h-full min-h-[400px]">
            <main id="container">
                <div className="dots">
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                </div>
                <div className="dots2">
                    <div className="dot2" />
                    <div className="dot2" />
                    <div className="dot2" />
                    <div className="dot2" />
                    <div className="dot2" />
                    <div className="dot2" />
                    <div className="dot2" />
                    <div className="dot2" />
                    <div className="dot2" />
                    <div className="dot2" />
                </div>
                <div className="circle" />
            </main>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
  #container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 300px;
  }

  .circle {
    position: relative;
    left: -100px;
    width: 0;
    height: 0;
    border: 50px solid #3b82f6; /* Orbit Primary Blue */
    border-radius: 50%;
    border-right-color: transparent;
    animation: move 5s linear 0s infinite normal forwards;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
    z-index: 10;
  }

  .circle:before {
    content: "";
    position: absolute;
    top: -50px;
    left: -50px;
    width: 0;
    height: 0;
    border: 50px solid #3b82f6;
    border-radius: 50%;
    border-right-color: transparent;
    animation: chomp1 .25s ease-in-out 0s infinite normal forwards;
  }

  .circle:after {
    content: "";
    position: absolute;
    top: -50px;
    left: -50px;
    width: 0;
    height: 0;
    border: 50px solid #3b82f6;
    border-radius: 50%;
    border-right-color: transparent;
    animation: chomp2 .25s ease-in-out 0s infinite normal forwards;
  }

  .dots {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1;
  }

  .dot {
    position: relative;
    width: 8px;
    height: 8px;
    margin: 0 10px;
    border-radius: 50%;
    background: #6366f1; /* Orbit Secondary Blue/Purple */
    animation: dot1 5s linear 0s infinite none normal;
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
  }

  .dot:nth-child(1) { animation-delay: 0s }
  .dot:nth-child(2) { animation-delay: 0.25s }
  .dot:nth-child(3) { animation-delay: 0.5s }
  .dot:nth-child(4) { animation-delay: 0.75s }
  .dot:nth-child(5) { animation-delay: 1s }
  .dot:nth-child(6) { animation-delay: 1.25s }
  .dot:nth-child(7) { animation-delay: 1.5s }
  .dot:nth-child(8) { animation-delay: 1.75s }
  .dot:nth-child(9) { animation-delay: 1.9s }
  .dot:nth-child(10) { animation-delay: 2.1s }

  .dots2 {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1;
  }

  .dot2 {
    position: relative;
    width: 8px;
    height: 8px;
    margin: 0 10px;
    border-radius: 50%;
    background: #10b981; /* Orbit Accent Green */
    opacity: 0;
    animation: dot2 5s linear 0s infinite none normal;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
  }

  .dot2:nth-child(10) { animation-delay: 2.5s }
  .dot2:nth-child(9) { animation-delay: 2.75s }
  .dot2:nth-child(8) { animation-delay: 3.0s }
  .dot2:nth-child(7) { animation-delay: 3.25s }
  .dot2:nth-child(6) { animation-delay: 3.5s }
  .dot2:nth-child(5) { animation-delay: 3.75s }
  .dot2:nth-child(4) { animation-delay: 4.0s }
  .dot2:nth-child(3) { animation-delay: 4.25s }
  .dot2:nth-child(2) { animation-delay: 4.5s }
  .dot2:nth-child(1) { animation-delay: 4.6s }

  @keyframes chomp1 {
    0% { transform: rotate(0deg); }
    50% { transform: rotate(45deg); }
    100% { transform: rotate(0deg); }
  }

  @keyframes chomp2 {
    0% { transform: rotate(0deg); }
    50% { transform: rotate(-45deg); }
    100% { transform: rotate(0deg); }
  }

  @keyframes move {
    0%, 100% { left: -150px; }
    0%, 48% { transform: rotateY(0deg); }
    50%, 100% { transform: rotateY(180deg); }
    50% { left: 150px; }
  }

  @keyframes dot1 {
    0%, 4% { background: #6366f1; opacity: 1; }
    5%, 94% { opacity: 0; }
    95%, 100% { background: #6366f1; opacity: 1; }
  }

  @keyframes dot2 {
    0%, 4% { background: #10b981; opacity: 1; }
    5%, 94% { opacity: 0; }
    95%, 100% { background: #10b981; opacity: 1; }
  }
`;

export default InnovationLoader;
