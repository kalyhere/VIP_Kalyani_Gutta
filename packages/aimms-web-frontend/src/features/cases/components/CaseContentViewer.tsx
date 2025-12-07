import React from "react"
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Divider,
  useTheme,
  alpha,
  Chip,
} from "@mui/material"

interface CaseContentViewerProps {
  caseContent: any
}

export const CaseContentViewer: React.FC<CaseContentViewerProps> = ({ caseContent }) => {
  const theme = useTheme()

  if (!caseContent) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">No case content available</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Case Header Section */}
      {caseContent.name && (
        <Box sx={{ mb: 3 }}>
          {/* <Typography
            variant="h6"
            sx={{ color: theme.palette.primary.main, mb: 1, fontWeight: "medium" }}>
            Case Content
          </Typography> */}

          {caseContent.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {caseContent.description}
            </Typography>
          )}

          {caseContent.difficulty && (
            <Chip
              label={`Difficulty: ${caseContent.difficulty}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 24, fontSize: "0.75rem" }}
            />
          )}
        </Box>
      )}

      {/* Sections */}
      {caseContent.sections?.map((section: any, sectionIndex: number) => (
        <Paper
          key={section.id || sectionIndex}
          elevation={0}
          variant="outlined"
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
          }}>
          {/* Section Title */}
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              pb: 1,
              borderBottom: "1px solid",
              borderColor: alpha(theme.palette.primary.main, 0.2),
            }}>
            {section.title}
          </Typography>

          {/* Tables in Section */}
          {section.tables?.map((table: any, tableIndex: number) => (
            <Box key={table.id || tableIndex} sx={{ mb: 3 }}>
              {/* Table Title */}
              {table.title && (
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 1,
                    fontWeight: "medium",
                    color: theme.palette.primary.main,
                  }}>
                  {table.title}
                </Typography>
              )}

              {/* Table Content */}
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, borderRadius: 1 }}>
                <Table size="small">
                  <TableBody>
                    {table.rows?.map((row: any, rowIndex: number) => (
                      <TableRow key={row.id || rowIndex}>
                        {row.cells?.map((cell: any, cellIndex: number) => (
                          <TableCell
                            key={cell.id || cellIndex}
                            sx={{
                              padding: "12px",
                              borderColor: "divider",
                              ...(table.hasHeader &&
                                rowIndex === 0 && {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                  fontWeight: 500,
                                }),
                              width: `${100 / (row.cells.length || 1)}%`,
                            }}>
                            {cell.imageUrls && cell.imageUrls.length > 0 ? (
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {cell.imageUrls.map((url: string, imgIndex: number) => {
                                  // Extract dimensions from image URL if they exist
                                  const dimensionsMatch = url.match(/#width=(\d+)&height=(\d+)/)
                                  const width = dimensionsMatch ? parseInt(dimensionsMatch[1]) : 100
                                  const height = dimensionsMatch
                                    ? parseInt(dimensionsMatch[2])
                                    : 100

                                  // Remove dimensions from src URL
                                  const cleanUrl = url.replace(/#width=\d+&height=\d+/, "")

                                  return (
                                    <Box
                                      key={imgIndex}
                                      sx={{
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 1,
                                        overflow: "hidden",
                                      }}>
                                      <img
                                        src={cleanUrl}
                                        alt={`Image ${imgIndex + 1}`}
                                        style={{
                                          width,
                                          height,
                                          objectFit: "contain",
                                          display: "block",
                                        }}
                                      />
                                    </Box>
                                  )
                                })}
                              </Box>
                            ) : (
                              <Typography variant="body2">
                                {cell.content ? cell.content : " "}
                              </Typography>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </Paper>
      ))}
    </Box>
  )
}

export default CaseContentViewer
