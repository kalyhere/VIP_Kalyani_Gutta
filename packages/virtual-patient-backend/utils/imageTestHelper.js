import axios from 'axios';
import { validateGCSConfig } from './authHelper.js';

/**
 * Test image loading for a specific region
 */
export async function testImageLoading(region, baseUrl = 'http://localhost:3001') {
  console.log(`🧪 Testing image loading for region: ${region}`);
  
  try {
    // Test the proxy endpoint
    const proxyUrl = `${baseUrl}/api/proxy-image/${region}`;
    console.log(`📡 Testing proxy endpoint: ${proxyUrl}`);
    
    const proxyResponse = await axios.get(proxyUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    console.log(`✅ Proxy test successful for ${region}:`);
    console.log(`   Status: ${proxyResponse.status}`);
    console.log(`   Content-Type: ${proxyResponse.headers['content-type']}`);
    console.log(`   Content-Length: ${proxyResponse.data.length} bytes`);
    
    return {
      success: true,
      method: 'proxy',
      status: proxyResponse.status,
      contentType: proxyResponse.headers['content-type'],
      size: proxyResponse.data.length
    };
    
  } catch (error) {
    console.error(`❌ Proxy test failed for ${region}:`, error.message);
    
    // Test the original body-part-image endpoint
    try {
      const bodyPartUrl = `${baseUrl}/api/body-part-image`;
      console.log(`📡 Testing body-part-image endpoint: ${bodyPartUrl}`);
      
      const bodyPartResponse = await axios.post(bodyPartUrl, {
        region,
        sessionId: 'test-session'
      });
      
      console.log(`✅ Body-part-image test successful for ${region}:`);
      console.log(`   Image URL: ${bodyPartResponse.data.imageUrl}`);
      
      return {
        success: true,
        method: 'body-part-image',
        imageUrl: bodyPartResponse.data.imageUrl,
        fallback: bodyPartResponse.data.fallback || false
      };
      
    } catch (bodyPartError) {
      console.error(`❌ Body-part-image test also failed for ${region}:`, bodyPartError.message);
      
      return {
        success: false,
        error: error.message,
        bodyPartError: bodyPartError.message
      };
    }
  }
}

/**
 * Test all regions
 */
export async function testAllRegions(baseUrl = 'http://localhost:3001') {
  const regions = ['head', 'lefteye', 'righteye', 'face', 'chest', 'abdomen'];
  const results = {};
  
  console.log('🧪 Testing all regions...');
  
  // Check GCS configuration first
  const config = validateGCSConfig();
  console.log('🔧 GCS Configuration:', config);
  
  for (const region of regions) {
    console.log(`\n--- Testing ${region} ---`);
    results[region] = await testImageLoading(region, baseUrl);
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const [region, result] of Object.entries(results)) {
    if (result.success) {
      successCount++;
      console.log(`✅ ${region}: ${result.method} (${result.fallback ? 'fallback' : 'GCS'})`);
    } else {
      failureCount++;
      console.log(`❌ ${region}: ${result.error}`);
    }
  }
  
  console.log(`\n📈 Summary: ${successCount} successful, ${failureCount} failed`);
  
  return {
    results,
    summary: {
      total: regions.length,
      successful: successCount,
      failed: failureCount,
      gcsConfigured: config.isValid
    }
  };
}

/**
 * Test Unity WebGL compatibility
 */
export async function testUnityCompatibility(baseUrl = 'http://localhost:3001') {
  console.log('🎮 Testing Unity WebGL compatibility...');
  
  const testRegions = ['head', 'lefteye', 'face'];
  const unityResults = {};
  
  for (const region of testRegions) {
    try {
      // Test CORS headers
      const response = await axios.options(`${baseUrl}/api/proxy-image/${region}`, {
        headers: {
          'Origin': 'https://your-unity-app.com',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      unityResults[region] = {
        corsSupported: true,
        headers: response.headers
      };
      
      console.log(`✅ CORS test passed for ${region}`);
      
    } catch (error) {
      unityResults[region] = {
        corsSupported: false,
        error: error.message
      };
      
      console.log(`❌ CORS test failed for ${region}: ${error.message}`);
    }
  }
  
  return unityResults;
} 