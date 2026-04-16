import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback,
  StyleSheet, KeyboardTypeOptions, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';

interface InputFieldProps {
  label?            : string;
  value             : string;
  onChangeText      : (text: string) => void;
  placeholder?      : string;
  secureTextEntry?  : boolean;
  keyboardType?     : KeyboardTypeOptions;
  leftIcon?         : keyof typeof Ionicons.glyphMap;
  rightIcon?        : keyof typeof Ionicons.glyphMap;
  onRightIconPress? : () => void;
  error?            : string;
  editable?         : boolean;
  style?            : ViewStyle;
  multiline?        : boolean;
  autoCapitalize?   : 'none' | 'sentences' | 'words' | 'characters';
  returnKeyType?    : 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?  : () => void;
}

export default function InputField({
  label, value, onChangeText, placeholder, secureTextEntry, keyboardType,
  leftIcon, rightIcon, onRightIconPress, error, editable = true, style,
  multiline, autoCapitalize, returnKeyType, onSubmitEditing,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      {/* Tapping anywhere on the container focuses the real TextInput */}
      <TouchableWithoutFeedback onPress={() => editable && inputRef.current?.focus()}>
        <View style={[
          styles.container,
          focused && styles.focused,
          !!error  && styles.errored,
          !editable && styles.disabled,
        ]}>
          {leftIcon && (
            <Ionicons name={leftIcon} size={18} color={focused ? Colors.primary : Colors.textMuted} style={styles.leftIcon} />
          )}
          <TextInput
            ref={inputRef}
            style={[styles.input, leftIcon && styles.inputWithLeft]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            editable={editable}
            multiline={multiline}
            autoCapitalize={autoCapitalize ?? 'none'}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={!multiline}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {rightIcon && (
            <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon} activeOpacity={0.7}>
              <Ionicons name={rightIcon} size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableWithoutFeedback>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: {
    ...Typography.captionMed,
    color       : Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontWeight  : '500',
  },
  container: {
    height         : 52,
    backgroundColor: Colors.white,
    borderRadius   : BorderRadius.md,
    borderWidth    : 1,
    borderColor    : Colors.border,
    flexDirection  : 'row',
    alignItems     : 'center',
    paddingHorizontal: Spacing.lg,
  },
  focused: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  errored: { borderColor: Colors.error },
  disabled: { backgroundColor: Colors.background, opacity: 0.7 },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  inputWithLeft: { marginLeft: Spacing.sm },
  leftIcon: { marginRight: 0 },
  rightIcon: { marginLeft: Spacing.sm },
  error: {
    ...Typography.tiny,
    color      : Colors.error,
    marginTop  : Spacing.xs,
  },
});
