'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Collapse,
  Divider,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ReplyAll as ReplyAllIcon,
  Reply as ReplyIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Email } from '@/lib/schema';
import { useUpdateEmail } from '@/hooks/useUpdateEmail';
import { useDeleteEmail } from '@/hooks/useDeleteEmail';
import { openComposerAtom } from '@/store/composers';
import { useSetAtom } from 'jotai';
import { CURRENT_USER_EMAIL } from '@/constants';
import {
  getInitials,
  formatDate,
  formatShortDate,
  getSenderName,
  getReplySubject,
  parseEmailList,
} from '@/utils';

interface ThreadMessageProps {
  email: Email;
  defaultExpanded?: boolean;
  isLast?: boolean;
}

export default function ThreadMessage({
  email,
  defaultExpanded = false,
  isLast = false,
}: ThreadMessageProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showActions, setShowActions] = useState(false);
  const updateEmail = useUpdateEmail();
  const deleteEmail = useDeleteEmail();
  const openComposer = useSetAtom(openComposerAtom);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleToggleImportant = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateEmail.mutate({
      id: email.id,
      isImportant: !email.isImportant,
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEmail.mutate(email.id);
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isOwnEmail =
      email.from.toLowerCase() === CURRENT_USER_EMAIL.toLowerCase();
    const replyTo = isOwnEmail ? parseEmailList(email.to) : [email.from];

    openComposer({
      to: replyTo,
      subject: getReplySubject(email.subject),
      content: undefined,
      threadId: email.threadId,
    });
  };

  const handleReplyAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isOwnEmail =
      email.from.toLowerCase() === CURRENT_USER_EMAIL.toLowerCase();

    const ccRecipients = parseEmailList(email.cc).filter(
      (addr) => addr.toLowerCase() !== CURRENT_USER_EMAIL.toLowerCase(),
    );
    const toRecipients = parseEmailList(email.to).filter(
      (addr) => addr.toLowerCase() !== CURRENT_USER_EMAIL.toLowerCase(),
    );

    if (isOwnEmail) {
      // Replying to own email: send to original recipients
      openComposer({
        to: toRecipients,
        cc: ccRecipients,
        subject: getReplySubject(email.subject),
        content: undefined,
        threadId: email.threadId,
      });
    } else {
      // Replying to someone else's email: send to sender, cc others
      openComposer({
        to: [email.from],
        cc: [...toRecipients, ...ccRecipients],
        subject: getReplySubject(email.subject),
        content: undefined,
        threadId: email.threadId,
      });
    }
  };

  const contentPreview = email.content
    ? email.content.substring(0, 80) + (email.content.length > 80 ? '...' : '')
    : 'No content';

  return (
    <Box
      sx={{
        borderBottom: isLast ? 'none' : '1px solid',
        borderBottomColor: 'divider',
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Box
        data-testid="thread-message-header"
        onClick={handleToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          cursor: 'pointer',
          backgroundColor: expanded ? 'action.selected' : 'transparent',
          '&:hover': {
            backgroundColor: expanded ? 'action.selected' : 'action.hover',
          },
          transition: 'background-color 0.2s',
        }}
      >
        <Avatar
          sx={{
            bgcolor: email.isImportant ? 'warning.main' : 'primary.main',
            width: 40,
            height: 40,
            fontSize: '1rem',
          }}
        >
          {getInitials(email.from)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {getSenderName(email.from)}
            </Typography>
            {email.direction === 'outgoing' && (
              <Chip
                label="Sent"
                size="small"
                color="info"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>

          {!expanded && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.85rem',
              }}
            >
              {contentPreview}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            opacity: showActions || expanded ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        >
          {!isLast && (
            <>
              <IconButton size="small" onClick={handleReply} title="Reply">
                <ReplyIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleReplyAll}
                title="Reply All"
              >
                <ReplyAllIcon fontSize="small" />
              </IconButton>
            </>
          )}
          <IconButton
            size="small"
            onClick={handleToggleImportant}
            color={email.isImportant ? 'warning' : 'default'}
          >
            {email.isImportant ? (
              <StarIcon fontSize="small" />
            ) : (
              <StarBorderIcon fontSize="small" />
            )}
          </IconButton>
          <IconButton
            size="small"
            onClick={handleDelete}
            disabled={deleteEmail.isPending}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: 'auto', flexShrink: 0 }}
          suppressHydrationWarning
        >
          {formatShortDate(email.createdAt)}
        </Typography>

        {expanded ? (
          <ExpandLessIcon color="action" />
        ) : (
          <ExpandMoreIcon color="action" />
        )}
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 2, py: 2, pl: 9 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              From: {email.from}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              To: {email.to}
            </Typography>
            {email.cc && (
              <Typography variant="body2" color="text.secondary">
                Cc: {email.cc}
              </Typography>
            )}
            {email.bcc && (
              <Typography variant="body2" color="text.secondary">
                Bcc: {email.bcc}
              </Typography>
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              suppressHydrationWarning
            >
              {formatDate(email.createdAt)}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7,
            }}
          >
            {email.content || 'No content'}
          </Typography>

          {isLast && (
            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <IconButton
                onClick={handleReply}
                size="small"
                title="Reply"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  px: 2,
                  gap: 0.5,
                }}
              >
                <ReplyIcon fontSize="small" />
                <Typography variant="body2">Reply</Typography>
              </IconButton>
              <IconButton
                onClick={handleReplyAll}
                size="small"
                title="Reply All"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  px: 2,
                  gap: 0.5,
                }}
              >
                <ReplyAllIcon fontSize="small" />
                <Typography variant="body2">Reply All</Typography>
              </IconButton>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
