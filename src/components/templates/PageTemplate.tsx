import { useContentMeasurements, useScreenDimensions } from '@hooks';
import {
  StyleSheet,
  View,
  LayoutChangeEvent,
  ViewStyle,
  Text,
} from 'react-native';
import { LoadingContainer } from '@molecules';
import React, { ReactNode } from 'react';
import { ContentMeasurementsProvider } from '@contexts';
import { NavigationBar } from '@organisms';
import { BlurView } from 'expo-blur';
import { useTheme } from '@react-navigation/native';

interface PageTemplateProps {
  children?: React.ReactNode | React.ReactNode[];
  isLoading?: boolean;
  loadingText?: string;
  isModalVisible?: boolean;
}

interface ActionItemsProps {
  children?: React.ReactNode | React.ReactNode[];
}

interface ModalContentProps {
  children?: React.ReactNode;
  isModalVisible?: boolean;
}

// ActionItems component that will be used as a compound component
const ActionItems: React.FC<ActionItemsProps> = () => null;

const ModalContent: React.FC<ModalContentProps> = () => null;

// Define the type for the PageTemplate component with its static properties
interface PageTemplateComponent extends React.FC<PageTemplateProps> {
  ActionItems: React.FC<ActionItemsProps>;
  ModalContent: React.FC<ModalContentProps>;
}

const text = 'Hello, my container is blurring contents underneath!';

// Create the Page component
const Page: React.FC<PageTemplateProps> = ({ children }) => {
  const { isLandscape } = useScreenDimensions();
  const { setIsReady, setDimensions, isReady } = useContentMeasurements();
  const { dark } = useTheme();
  const blurTint = dark ? 'dark' : 'light';

  // Extract action items from children
  const { otherChildren, actionItems } = separateChildren(children);

  // responsive styles for orientation
  const contentContainerStyles = [
    styles.contentContainer,
    { flexDirection: isLandscape ? 'row' : 'column' } as ViewStyle,
  ];

  const actionBarStyles = [
    styles.actionBarBase,
    { flexDirection: isLandscape ? 'column' : 'row' } as ViewStyle,
  ];

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
    setIsReady(true);
  };

  return (
    <View style={styles.rootContainer}>
      <View style={contentContainerStyles}>
        <NavigationBar />
        <View style={styles.mainContent} onLayout={onLayout}>
          <LoadingContainer isReady={isReady}>{otherChildren}</LoadingContainer>
        </View>
        <View style={actionBarStyles}>{actionItems}</View>
      </View>
      <BlurView intensity={70} tint={blurTint} style={styles.blurContainer}>
        <View style={styles.blurContent}>
          <Text style={styles.text}>{text}</Text>
        </View>
      </BlurView>
    </View>
  );
};

// Export a wrapped version of AppShellLayout with ContentMeasurementsProvider
export const PageTemplate: PageTemplateComponent = (props) => {
  return (
    <ContentMeasurementsProvider>
      <Page {...props} />
    </ContentMeasurementsProvider>
  );
};

// Attach ActionItems to the wrapped component
PageTemplate.ActionItems = ActionItems;
PageTemplate.ModalContent = ModalContent;

const styles = StyleSheet.create({
  rootContainer: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
  },
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContent: {
    width: 'auto',
    height: 'auto',
    display: 'flex',
    backgroundColor: 'rgba(50, 50, 50, 0.7)',
    padding: 16,
    borderRadius: 16,
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    margin: 16,
    position: 'relative',
  },
  actionBarBase: {
    display: 'flex',
    flexGrow: 0,
    justifyContent: 'space-evenly',
    padding: 16,
  },
});

// Separate children into action items and other children
const separateChildren = (
  children: React.ReactNode
): { actionItems: ReactNode[]; otherChildren: ReactNode[] } => {
  const actionItems: ReactNode[] = [];
  const otherChildren: ReactNode[] = [];
  const modalContent: ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (!child || !React.isValidElement(child)) {
      otherChildren.push(child);
      return;
    }

    const actionItem = getActionItem(child);
    const modalContent = getModalContent(child);

    if (actionItem) {
      actionItems.push(...React.Children.toArray(actionItem));
    } else if (modalContent) {
      modalContent.push(...React.Children.toArray(modalContent));
    } else {
      otherChildren.push(child);
    }
  });

  return { otherChildren, actionItems };
};

const getActionItem = (
  child:
    | React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>
    | React.ReactPortal
) => {
  const isActionItem =
    child.type === ActionItems ||
    (typeof child.type === 'function' && child.type.name === 'ActionItems');

  if (isActionItem) {
    const element = child as React.ReactElement<{
      children?: React.ReactNode;
    }>;
    return element.props.children;
  }
  return null;
};

const getModalContent = (
  child:
    | React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>
    | React.ReactPortal
) => {
  const isModalContent =
    child.type === ModalContent ||
    (typeof child.type === 'function' && child.type.name === 'ModalContent');

  if (isModalContent) {
    const element = child as React.ReactElement<{
      children?: React.ReactNode;
    }>;
    return element.props.children;
  }
  return null;
};
