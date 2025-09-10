'use client';

import {
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconEye,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CategoryFromTRPC } from '@/types/trpc';

interface TreeNode {
  id: string;
  name: string;
  color: string;
  flow: string;
  parentId: string | null;
  isArchived: boolean;
  children: TreeNode[];
}

interface SimpleCategoryTreeProps {
  data: CategoryFromTRPC[];
  onView: (category: CategoryFromTRPC) => void;
  onEdit: (category: CategoryFromTRPC) => void;
  onDelete: (category: CategoryFromTRPC) => void;
  onCreateSubcategory: (parentCategory: CategoryFromTRPC) => void;
  getParentCategoryName: (parentId: string | null | undefined) => string | null;
}

function buildTreeData(categories: CategoryFromTRPC[]): TreeNode[] {
  const categoryMap = new Map<string, TreeNode>();
  const rootItems: TreeNode[] = [];

  for (const category of categories) {
    const treeNode: TreeNode = {
      id: category.id,
      name: category.name,
      color: category.color || '#000',
      flow: category.flow,
      parentId: category.parentId,
      isArchived: category.isArchived,
      children: [],
    };
    categoryMap.set(category.id, treeNode);
  }

  // Build the hierarchy
  for (const category of categories) {
    const treeNode = categoryMap.get(category.id);
    if (!treeNode) continue;

    if (category.parentId === null) {
      rootItems.push(treeNode);
    } else {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(treeNode);
      }
    }
  }

  return rootItems;
}

function SimpleTreeNode({
  node,
  level = 0,
  onView,
  onEdit,
  onDelete,
  onCreateSubcategory,
  getParentCategoryName,
}: {
  node: TreeNode;
  level?: number;
  onView: (category: CategoryFromTRPC) => void;
  onEdit: (category: CategoryFromTRPC) => void;
  onDelete: (category: CategoryFromTRPC) => void;
  onCreateSubcategory: (parentCategory: CategoryFromTRPC) => void;
  getParentCategoryName: (parentId: string | null | undefined) => string | null;
}) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const hasChildren = node.children && node.children.length > 0;

  // Convert TreeNode to CategoryFromTRPC for handlers
  const convertToCategory = (treeNode: TreeNode): CategoryFromTRPC => ({
    id: treeNode.id,
    name: treeNode.name,
    color: treeNode.color,
    flow: treeNode.flow as 'expense' | 'income',
    parentId: treeNode.parentId,
    isArchived: treeNode.isArchived,
    userId: '',
    createdAt: '',
    archivedAt: null,
  });

  const handleView = () => {
    onView(convertToCategory(node));
  };

  const handleEdit = () => {
    onEdit(convertToCategory(node));
  };

  const handleDelete = () => {
    onDelete(convertToCategory(node));
  };

  const handleCreateSubcategory = () => {
    onCreateSubcategory(convertToCategory(node));
  };

  return (
    <div className="select-none">
      <div
        className="flex items-center justify-between w-full group py-1 px-2 hover:bg-accent rounded cursor-pointer"
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <IconChevronDown className="h-3 w-3" />
              ) : (
                <IconChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-4" />}

          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: node.color }}
            />
            <span className="text-sm font-medium">{node.name}</span>
            {/* <span className="text-xs text-muted-foreground capitalize">
              {node.flow}
            </span> */}
            {node.isArchived && (
              <span className="text-xs text-muted-foreground italic">
                (archived)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <IconPlus className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCreateSubcategory}>
                <IconPlus className="mr-2 h-4 w-4" />
                Add subcategory
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <IconEdit className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView}>
                <IconEye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <SimpleTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateSubcategory={onCreateSubcategory}
              getParentCategoryName={getParentCategoryName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SimpleCategoryTree({
  data,
  onView,
  onEdit,
  onDelete,
  onCreateSubcategory,
  getParentCategoryName,
}: SimpleCategoryTreeProps) {
  const treeData = buildTreeData(data);

  return (
    <div className="w-full">
      {treeData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-lg">No categories found</div>
          <div className="text-sm">
            Create your first category to start organizing your transactions
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {treeData.map((node) => (
            <SimpleTreeNode
              key={node.id}
              node={node}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateSubcategory={onCreateSubcategory}
              getParentCategoryName={getParentCategoryName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
