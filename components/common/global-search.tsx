'use client';

import { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Kbd } from '@/components/ui/kbd';

export interface SearchItem {
  id: string;
  label: string;
  value: string;
  group?: string;
  onSelect?: () => void;
}

export interface GlobalSearchProps {
  placeholder?: string;
  emptyText?: string;
  loadingText?: string;
  onSearch: (query: string) => Promise<SearchItem[]> | SearchItem[];
  groupBy?: boolean;
  minSearchLength?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GlobalSearch({
  placeholder = '搜索...',
  emptyText = '未找到结果',
  loadingText = '搜索中...',
  onSearch,
  groupBy = true,
  minSearchLength = 1,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: GlobalSearchProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setItems([]);
    }
  }, [open]);

  async function handleSearch() {
    if (!query || query.length < minSearchLength) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const results = await onSearch(query);
      setItems(results);
    } catch (error) {
      console.error('Search error:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const groupedItems = groupBy
    ? items.reduce(
        (acc, item) => {
          const group = item.group || '其他';
          if (!acc[group]) {
            acc[group] = [];
          }
          acc[group].push(item);
          return acc;
        },
        {} as Record<string, SearchItem[]>,
      )
    : { 全部: items };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={placeholder}
        value={query}
        onValueChange={(value) => {
          setQuery(value);
          if (!value) {
            setItems([]);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && items.length === 0) {
            event.preventDefault();
            void handleSearch();
          }
        }}
      />
      <CommandList>
        {loading ? (
          <CommandEmpty>{loadingText}</CommandEmpty>
        ) : query.length < minSearchLength ? (
          <CommandEmpty>请输入至少 {minSearchLength} 个字符进行搜索</CommandEmpty>
        ) : items.length === 0 ? (
          <CommandEmpty>{emptyText}</CommandEmpty>
        ) : (
          Object.entries(groupedItems).map(([group, groupItems]) => (
            <CommandGroup key={group} heading={group}>
              {groupItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.value}
                  onSelect={() => {
                    item.onSelect?.();
                    setOpen(false);
                  }}
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))
        )}
      </CommandList>
      <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Kbd>↵</Kbd>
          <span>搜索 / 打开</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Kbd>↑↓</Kbd>
          <span>选择</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Kbd>Esc</Kbd>
          <span>关闭</span>
        </div>
      </div>
    </CommandDialog>
  );
}
