import React, { useState, useEffect, useRef } from 'react';
import { Animated, TextProps } from 'react-native';

const LOADING_PHRASES = [
  "Detecting routes...",
  "Analyzing historical patterns...",
  "Evaluating crowd density...",
  "Formulating insights...",
  "Finalizing recommendations..."
];

interface Props extends TextProps {
  intervalMs?: number;
}

export default function FadingAIText({ intervalMs = 2000, style, ...props }: Props) {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;
    
    const animateText = () => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!isMounted || !finished) return;
        
        // Change text while invisible
        setIndex(prev => (prev + 1) % LOADING_PHRASES.length);
        
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    };

    const interval = setInterval(animateText, intervalMs);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fadeAnim, intervalMs]);

  return (
    <Animated.Text style={[style, { opacity: fadeAnim }]} {...props}>
      {LOADING_PHRASES[index]}
    </Animated.Text>
  );
}
