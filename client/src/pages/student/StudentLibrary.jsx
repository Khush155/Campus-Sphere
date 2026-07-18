import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, CardMedia, Chip, Button, 
  Tabs, Tab, TextField, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress
} from '@mui/material';
import { Search, LibraryBooks, Book as BookIcon, Warning, CheckCircle, MonetizationOn } from '@mui/icons-material';
import { useLibraryQuery } from '../../queries/utilityQueries';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const StudentLibrary = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading } = useLibraryQuery();

  if (isLoading) {
    return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  const books = data?.books || [];
  const transactions = data?.transactions || [];

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Issued': return 'primary';
      case 'Returned': return 'success';
      case 'Overdue': return 'error';
      case 'Lost': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
        Library
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Search the college catalog and manage your borrowed books.
      </Typography>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 3, overflow: 'hidden' }} elevation={0} variant="outlined">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Catalog Search" sx={{ fontWeight: 600 }} />
            <Tab label={`My Books (${transactions.filter(t => t.status === 'Issued' || t.status === 'Overdue').length})`} sx={{ fontWeight: 600 }} />
          </Tabs>
        </Box>

        {/* Catalog Search Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 3, pb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by book title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 4 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <Grid container spacing={3}>
              {filteredBooks.length > 0 ? filteredBooks.map(book => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={book._id}>
                  <Card variant="outlined" sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ height: 160, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {book.coverUrl ? (
                        <CardMedia component="img" image={book.coverUrl} alt={book.title} sx={{ height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <LibraryBooks sx={{ fontSize: 60, color: 'text.disabled' }} />
                      )}
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="700" sx={{ lineHeight: 1.2, mb: 1 }}>{book.title}</Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>by {book.author}</Typography>
                      
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip label={book.category} size="small" variant="outlined" />
                        <Typography variant="caption" fontWeight="600" color={book.availableCopies > 0 ? 'success.main' : 'error.main'}>
                          {book.availableCopies > 0 ? `${book.availableCopies} Available` : 'Out of Stock'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )) : (
                <Grid item xs={12}>
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No books found matching your search.</Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </TabPanel>

        {/* My Books Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Book Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Issue Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fines</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length > 0 ? transactions.map((tx) => (
                  <TableRow key={tx._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookIcon color="action" fontSize="small" />
                        {tx.bookId?.title || 'Unknown Book'}
                      </Box>
                    </TableCell>
                    <TableCell>{new Date(tx.issueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color={new Date(tx.dueDate) < new Date() && tx.status !== 'Returned' ? 'error.main' : 'text.primary'} fontWeight={new Date(tx.dueDate) < new Date() && tx.status !== 'Returned' ? '600' : '400'}>
                        {new Date(tx.dueDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={tx.status} 
                        color={getStatusColor(tx.status)} 
                        size="small" 
                        icon={tx.status === 'Returned' ? <CheckCircle /> : (tx.status === 'Overdue' ? <Warning /> : undefined)}
                      />
                    </TableCell>
                    <TableCell>
                      {tx.fineAmount > 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: tx.finePaid ? 'success.main' : 'error.main' }}>
                          <MonetizationOn fontSize="small" />
                          <Typography variant="body2" fontWeight="600">₹{tx.fineAmount}</Typography>
                          <Chip label={tx.finePaid ? 'Paid' : 'Unpaid'} size="small" variant="outlined" color={tx.finePaid ? 'success' : 'error'} sx={{ ml: 1, height: 20 }} />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      You have no library transactions.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default StudentLibrary;
