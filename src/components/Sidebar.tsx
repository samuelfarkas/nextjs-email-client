'use client';

import Link from 'next/link';
import {
  Box,
  Divider,
  MenuList,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import StarIcon from '@mui/icons-material/Star';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useSetAtom, useAtomValue } from 'jotai';
import { openComposerAtom, canOpenComposerAtom } from '@/store/composers';
import { useTypedSearchParams } from '@/hooks/useTypedSearchParams';
import { emailListParamsSchema } from '@/lib/searchParams';

export default function Sidebar() {
  const openComposer = useSetAtom(openComposerAtom);
  const canOpenComposer = useAtomValue(canOpenComposerAtom);
  const { params } = useTypedSearchParams(emailListParamsSchema);
  const currentFilter = params.filter;

  const getMenuItemSx = (isSelected: boolean) => ({
    borderRadius: 2,
    mb: 0.5,
    ...(isSelected && {
      '&&': {
        backgroundColor: 'primary.light',
        color: 'primary.contrastText',
      },
      '&&:hover': {
        backgroundColor: 'primary.main',
      },
    }),
  });

  const getIconSx = (isSelected: boolean) => ({
    minWidth: 40,
    ...(isSelected && { color: 'primary.contrastText' }),
  });

  return (
    <Paper
      elevation={1}
      sx={{
        width: 280,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        borderRight: '1px solid',
        borderRightColor: 'divider',
      }}
    >
      <Box
        sx={{ p: 3, borderBottom: '1px solid', borderBottomColor: 'divider' }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          📧 Email Client
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<EditIcon />}
          onClick={() => openComposer()}
          disabled={!canOpenComposer}
          sx={{
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Compose
        </Button>
      </Box>

      <Box sx={{ flex: 1, p: 1 }}>
        <MenuList sx={{ p: 0 }}>
          <MenuItem
            component={Link}
            href="/"
            selected={currentFilter === 'inbox'}
            sx={getMenuItemSx(currentFilter === 'inbox')}
            data-testid="filter-inbox"
            data-selected={currentFilter === 'inbox'}
          >
            <ListItemIcon sx={getIconSx(currentFilter === 'inbox')}>
              <InboxIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Inbox"
              slotProps={{ primary: { fontWeight: 500 } }}
            />
          </MenuItem>
          <MenuItem
            component={Link}
            href="/?filter=important"
            selected={currentFilter === 'important'}
            sx={getMenuItemSx(currentFilter === 'important')}
            data-testid="filter-important"
            data-selected={currentFilter === 'important'}
          >
            <ListItemIcon sx={getIconSx(currentFilter === 'important')}>
              <StarIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Important"
              slotProps={{ primary: { fontWeight: 500 } }}
            />
          </MenuItem>
          <MenuItem
            component={Link}
            href="/?filter=sent"
            selected={currentFilter === 'sent'}
            sx={getMenuItemSx(currentFilter === 'sent')}
            data-testid="filter-sent"
            data-selected={currentFilter === 'sent'}
          >
            <ListItemIcon sx={getIconSx(currentFilter === 'sent')}>
              <SendIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Sent"
              slotProps={{ primary: { fontWeight: 500 } }}
            />
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem
            component={Link}
            href="/?filter=trash"
            selected={currentFilter === 'trash'}
            sx={getMenuItemSx(currentFilter === 'trash')}
            data-testid="filter-trash"
            data-selected={currentFilter === 'trash'}
          >
            <ListItemIcon sx={getIconSx(currentFilter === 'trash')}>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Trash"
              slotProps={{ primary: { fontWeight: 500 } }}
            />
          </MenuItem>
        </MenuList>
      </Box>
    </Paper>
  );
}
