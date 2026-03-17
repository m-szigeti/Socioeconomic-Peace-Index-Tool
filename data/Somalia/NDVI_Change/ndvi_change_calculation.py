import os
import re
import numpy as np
import rasterio
from rasterio.enums import Resampling
import matplotlib.pyplot as plt
from pathlib import Path

# Configuration - Update these paths
INPUT_FOLDER = r"C:\Users\Martin\Documents\UN_work\RSCA\Somalia_NDVI_Change_1km"  # Folder containing .tif files
OUTPUT_FOLDER = r"C:\Users\Martin\Documents\UN_work\RSCA\Somalia_NDVI_Change_1km"  # Folder for results

def extract_year_from_filename(filename):
    """Extract year from filename using regex"""
    # Look for 4-digit year (1900-2099)
    year_match = re.search(r'(19|20)\d{2}', filename)
    if year_match:
        return int(year_match.group())
    return None

def load_and_process_ndvi_files(folder_path):
    """Load all NDVI .tif files and organize by year"""
    ndvi_data = {}
    
    # Get all .tif files
    tif_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.tif')]
    
    if not tif_files:
        raise ValueError(f"No .tif files found in {folder_path}")
    
    print(f"Found {len(tif_files)} .tif files")
    
    # Process each file
    for filename in tif_files:
        year = extract_year_from_filename(filename)
        if year is None:
            print(f"Warning: Could not extract year from {filename}, skipping...")
            continue
            
        file_path = os.path.join(folder_path, filename)
        
        try:
            with rasterio.open(file_path) as src:
                # Read the data
                data = src.read(1)  # Read first band
                
                # Handle nodata values
                if src.nodata is not None:
                    data = np.where(data == src.nodata, np.nan, data)
                
                # Store metadata for the first file (assuming all have same extent/resolution)
                if not ndvi_data:
                    reference_meta = src.meta.copy()
                    reference_transform = src.transform
                    reference_shape = data.shape
                
                # Ensure all arrays have the same shape (basic check)
                if data.shape != reference_shape:
                    print(f"Warning: {filename} has different shape {data.shape} vs {reference_shape}")
                    # You might want to resample here if needed
                    continue
                
                ndvi_data[year] = data
                print(f"Loaded {filename} for year {year}")
                
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            continue
    
    if len(ndvi_data) < 2:
        raise ValueError("Need at least 2 years of data to calculate change")
    
    return ndvi_data, reference_meta

def calculate_ndvi_change(ndvi_data):
    """Calculate NDVI change over time"""
    years = sorted(ndvi_data.keys())
    first_year = years[0]
    last_year = years[-1]
    
    print(f"Calculating change from {first_year} to {last_year}")
    print(f"Total years analyzed: {len(years)} ({years})")
    
    # Calculate year-to-year changes
    annual_changes = []
    change_periods = []
    
    for i in range(len(years) - 1):
        year1 = years[i]
        year2 = years[i + 1]
        
        change = ndvi_data[year2] - ndvi_data[year1]
        annual_changes.append(change)
        change_periods.append(f"{year1}-{year2}")
        print(f"Calculated change for {year1} to {year2}")
    
    # Average of all year-to-year changes
    annual_changes_array = np.array(annual_changes)
    average_annual_change = np.nanmean(annual_changes_array, axis=0)
    
    # Total change (first to last year)
    first_ndvi = ndvi_data[first_year]
    last_ndvi = ndvi_data[last_year]
    total_change = last_ndvi - first_ndvi
    
    # Calculate statistics
    total_change_mean = np.nanmean(total_change)
    annual_change_mean = np.nanmean(average_annual_change)
    
    # Calculate percentage change (where first_ndvi != 0)
    with np.errstate(divide='ignore', invalid='ignore'):
        percent_change = (total_change / first_ndvi) * 100
        percent_change_mean = np.nanmean(percent_change[np.isfinite(percent_change)])
    
    # Calculate area statistics using average annual change
    total_pixels = np.sum(~np.isnan(average_annual_change))
    improved_pixels = np.sum(average_annual_change > 0)
    declined_pixels = np.sum(average_annual_change < 0)
    unchanged_pixels = np.sum(average_annual_change == 0)
    
    # Results dictionary
    results = {
        'first_year': first_year,
        'last_year': last_year,
        'num_change_periods': len(annual_changes),
        'change_periods': change_periods,
        'total_change_mean': total_change_mean,
        'annual_change_mean': annual_change_mean,
        'percent_change_mean': percent_change_mean,
        'total_pixels': total_pixels,
        'improved_pixels': improved_pixels,
        'declined_pixels': declined_pixels,
        'unchanged_pixels': unchanged_pixels,
        'percent_improved': (improved_pixels / total_pixels) * 100 if total_pixels > 0 else 0,
        'percent_declined': (declined_pixels / total_pixels) * 100 if total_pixels > 0 else 0,
        'total_change': total_change,
        'average_annual_change': average_annual_change,
        'individual_annual_changes': annual_changes,
        'first_ndvi': first_ndvi,
        'last_ndvi': last_ndvi
    }
    
    return results

def save_change_maps(results, output_folder, reference_meta):
    """Save change maps as .tif files"""
    os.makedirs(output_folder, exist_ok=True)
    
    # Update metadata for output files
    output_meta = reference_meta.copy()
    output_meta.update(dtype=rasterio.float32, count=1, nodata=np.nan)
    
    # Save total change map
    total_change_path = os.path.join(output_folder, 'ndvi_total_change.tif')
    with rasterio.open(total_change_path, 'w', **output_meta) as dst:
        dst.write(results['total_change'].astype(np.float32), 1)
    
    # Save average annual change map
    annual_change_path = os.path.join(output_folder, 'ndvi_average_annual_change.tif')
    with rasterio.open(annual_change_path, 'w', **output_meta) as dst:
        dst.write(results['average_annual_change'].astype(np.float32), 1)
    
    print(f"Change maps saved to {output_folder}")
    return total_change_path, annual_change_path

def create_visualization(results, output_folder):
    """Create visualization plots"""
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    
    # Plot 1: Total change map
    im1 = axes[0,0].imshow(results['total_change'], cmap='RdYlGn', vmin=-0.5, vmax=0.5)
    axes[0,0].set_title(f'Total NDVI Change ({results["first_year"]}-{results["last_year"]})')
    axes[0,0].axis('off')
    plt.colorbar(im1, ax=axes[0,0], label='NDVI Change')
    
    # Plot 2: Average annual change map
    im2 = axes[0,1].imshow(results['average_annual_change'], cmap='RdYlGn', vmin=-0.1, vmax=0.1)
    axes[0,1].set_title('Average Annual NDVI Change')
    axes[0,1].axis('off')
    plt.colorbar(im2, ax=axes[0,1], label='Avg Annual NDVI Change')
    
    # Plot 3: Change histogram
    valid_changes = results['average_annual_change'][~np.isnan(results['average_annual_change'])]
    axes[1,0].hist(valid_changes, bins=50, alpha=0.7, color='green')
    axes[1,0].axvline(0, color='red', linestyle='--', label='No change')
    axes[1,0].axvline(np.mean(valid_changes), color='blue', linestyle='-', label=f'Mean: {np.mean(valid_changes):.4f}')
    axes[1,0].set_xlabel('Average Annual NDVI Change')
    axes[1,0].set_ylabel('Frequency')
    axes[1,0].set_title('Distribution of Avg Annual NDVI Changes')
    axes[1,0].legend()
    
    # Plot 4: Summary statistics
    axes[1,1].axis('off')
    periods_text = ', '.join(results['change_periods'])
    stats_text = f"""
    Analysis Period: {results['first_year']} to {results['last_year']}
    Change Periods: {periods_text}
    Number of year-to-year changes: {results['num_change_periods']}
    
    Average Annual NDVI Change: {results['annual_change_mean']:.6f}
    Total NDVI Change: {results['total_change_mean']:.4f}
    Percentage Change: {results['percent_change_mean']:.2f}%
    
    Area Analysis (based on avg annual change):
    • Improving: {results['percent_improved']:.1f}% ({results['improved_pixels']:,} pixels)
    • Declining: {results['percent_declined']:.1f}% ({results['declined_pixels']:,} pixels)
    • Unchanged: {results['unchanged_pixels']:,} pixels
    
    Total valid pixels: {results['total_pixels']:,}
    """
    axes[1,1].text(0.1, 0.9, stats_text, transform=axes[1,1].transAxes, 
                   fontsize=11, verticalalignment='top', fontfamily='monospace')
    
    plt.tight_layout()
    
    # Save plot
    plot_path = os.path.join(output_folder, 'ndvi_change_analysis.png')
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    print(f"Visualization saved to {plot_path}")
    plt.show()

def print_summary(results):
    """Print summary statistics"""
    print("\n" + "="*60)
    print("NDVI CHANGE ANALYSIS SUMMARY")
    print("="*60)
    print(f"Analysis period: {results['first_year']} to {results['last_year']} ({results['years_span']} years)")
    print(f"Total valid pixels analyzed: {results['total_pixels']:,}")
    print("\nAverage NDVI Changes:")
    print(f"  Total change: {results['total_change_mean']:.6f}")
    print(f"  Annual change: {results['annual_change_mean']:.6f}")
    print(f"  Percentage change: {results['percent_change_mean']:.2f}%")
    print("\nArea Analysis:")
    print(f"  Vegetation improved: {results['percent_improved']:.1f}% ({results['improved_pixels']:,} pixels)")
    print(f"  Vegetation declined: {results['percent_declined']:.1f}% ({results['declined_pixels']:,} pixels)")
    print(f"  No change: {results['unchanged_pixels']:,} pixels")
    
    if results['total_change_mean'] > 0:
        print(f"\n✓ Overall trend: VEGETATION IMPROVEMENT (+{results['total_change_mean']:.6f} NDVI units)")
    elif results['total_change_mean'] < 0:
        print(f"\n⚠ Overall trend: VEGETATION DECLINE ({results['total_change_mean']:.6f} NDVI units)")
    else:
        print(f"\n→ Overall trend: NO SIGNIFICANT CHANGE")
    print("="*60)

def main():
    """Main analysis function"""
    try:
        print("Starting NDVI change analysis...")
        
        # Load NDVI data
        ndvi_data, reference_meta = load_and_process_ndvi_files(INPUT_FOLDER)
        
        # Calculate changes
        results = calculate_ndvi_change(ndvi_data)
        
        # Create output folder
        os.makedirs(OUTPUT_FOLDER, exist_ok=True)
        
        # Save change maps
        save_change_maps(results, OUTPUT_FOLDER, reference_meta)
        
        # Create visualization
       # create_visualization(results, OUTPUT_FOLDER)
        
        # Print summary
       # print_summary(results)
        
        print(f"\nAnalysis complete! Results saved to: {OUTPUT_FOLDER}")
        
    except Exception as e:
        print(f"Error during analysis: {e}")
        raise

if __name__ == "__main__":
    main()