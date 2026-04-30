import React from "react";
import { MenuItem, MenuItemProps, Group } from "@/components";

export const MenuItemFlatlist = ({ data, style, ...props }: MenuItemProps & { data: MenuItemProps[] }) => (
  <Group style={style}>
    {data.map((item, index) => (
      <MenuItem {...item} {...props} key={index} />
    ))}
  </Group>
);
