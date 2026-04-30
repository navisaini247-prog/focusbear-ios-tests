import React, { useMemo } from "react";
import { View, ViewProps, StyleSheet } from "react-native";

interface GroupItemProps {
  joinTop?: boolean;
  joinBottom?: boolean;
  joinLeft?: boolean;
  joinRight?: boolean;
  child: React.ReactNode;
}

export interface GroupProps extends ViewProps, Omit<GroupItemProps, "child"> {
  horizontal?: boolean;
  children: React.ReactNode;
}

export const Group: React.FC<GroupProps> = ({
  joinTop,
  joinBottom,
  joinLeft,
  joinRight,
  horizontal,
  children,
  style,
}) => {
  const childrenArray = React.Children.toArray(children);
  const numChildren = childrenArray.length;

  return (
    <View style={[horizontal && styles.horizontal, style]}>
      {React.Children.map(childrenArray, (child, index) => {
        const isFirst = index === 0;
        const isLast = index === numChildren - 1;

        return horizontal ? (
          <GroupItem
            key={index}
            joinLeft={joinLeft || (!isFirst && numChildren > 1)}
            joinRight={joinRight || (!isLast && numChildren > 1)}
            {...{ joinTop, joinBottom, child }}
          />
        ) : (
          <GroupItem
            key={index}
            joinTop={joinTop || (!isFirst && numChildren > 1)}
            joinBottom={joinBottom || (!isLast && numChildren > 1)}
            {...{ joinLeft, joinRight, child }}
          />
        );
      })}
    </View>
  );
};

const GroupItem: React.FC<GroupItemProps> = ({ joinTop, joinBottom, joinLeft, joinRight, child }) => {
  const isElement = React.isValidElement(child) && child.type !== React.Fragment;

  // This is trying to minimise rerenders, but we often pass anonymous
  // functions to our components causing them to always rerender anyway
  const style = useMemo(
    () => [
      isElement && child.props?.style,
      {
        ...((joinTop || joinLeft) && { borderTopLeftRadius: 0 }),
        ...((joinTop || joinRight) && { borderTopRightRadius: 0 }),
        ...((joinBottom || joinLeft) && { borderBottomLeftRadius: 0 }),
        ...((joinBottom || joinRight) && { borderBottomRightRadius: 0 }),
        ...(joinRight && { marginRight: -1 }),
        ...(joinBottom && { marginBottom: -1 }),
      },
    ],
    // @ts-ignore
    [joinTop, joinBottom, joinLeft, joinRight, isElement, child?.props?.style],
  );

  if (!isElement) {
    return child;
  }

  return React.cloneElement(child as React.ReactElement, { style, ...{ joinTop, joinBottom, joinLeft, joinRight } });
};

const styles = StyleSheet.create({
  horizontal: {
    flexDirection: "row",
  },
});
