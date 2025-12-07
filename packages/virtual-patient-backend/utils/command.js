import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export const execCommand = async (command, args = []) => {
  try {
    console.log(`Executing command: ${command}${args.length ? ' ' + args.join(' ') : ''}`);
    
    // Execute command with arguments properly separated
    const { stdout, stderr } = await execPromise(
      args.length ? `${command} ${args.join(' ')}` : command
    );

    // Log any stderr output that isn't ffmpeg configuration info
    if (stderr && typeof stderr === 'string' && !stderr.includes('configuration:')) {
      console.log(`Command stderr: ${stderr}`);
    }

    return {
      stdout: stdout ? stdout.toString().trim() : '',
      stderr: stderr ? stderr.toString().trim() : ''
    };
  } catch (error) {
    console.error(`Command execution error for '${command}':`, error.message);
    if (error.stderr) console.error('stderr:', error.stderr);
    if (error.stdout) console.error('stdout:', error.stdout);
    throw error;
  }
}; 